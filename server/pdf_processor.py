from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.errors import HttpError
import base64
import pickle
import os
import pymongo
from datetime import datetime, timedelta
import re
import json
import google.generativeai as genai
import io
import random
from forex_python.converter import CurrencyRates
import time
from functools import wraps

# Define scopes - we need read access to Gmail
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

# Gemini API configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# MongoDB connection string
MONGO_URI = os.environ.get("MONGO_URI", "")

def process_pdf_attachment(attachment_data):
    """Process PDF attachment data and return properly encoded base64 string."""
    try:
        # Decode the URL-safe base64 data
        pdf_content = base64.urlsafe_b64decode(attachment_data)
        
        # Re-encode as standard base64
        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
        
        return pdf_base64
    except Exception as e:
        print(f"Error processing PDF attachment: {e}")
        return None

def process_email(service, msg_id, db):
    """Processes a single email with invoice in subject."""
    try:
        message = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
        headers = message['payload']['headers']
        subject = next((header['value'] for header in headers if header['name'] == 'Subject'), 'No Subject')
        
        print(f"Processing: {subject}")
        
        # Check for PDF attachment
        pdf_content = None
        pdf_base64 = None
        if 'parts' in message['payload']:
            for part in message['payload']['parts']:
                if 'filename' in part and part['filename'] and part['filename'].lower().endswith('.pdf'):
                    if 'body' in part and 'attachmentId' in part['body']:
                        attachment_id = part['body']['attachmentId']
                        attachment = service.users().messages().attachments().get(
                            userId='me', messageId=msg_id, id=attachment_id).execute()
                        
                        # Process the PDF attachment properly
                        pdf_base64 = process_pdf_attachment(attachment['data'])
                        if pdf_base64:
                            pdf_content = base64.b64decode(pdf_base64)
        
        invoices_collection = db['invoices']
        
        if pdf_content:
            try:
                gemini_data = process_pdf_with_gemini(pdf_content)
                if gemini_data:
                    invoice_doc = create_invoice_document(gemini_data, pdf_base64)
                else:
                    invoice_doc = extract_basic_invoice_details(message['payload'])
                    invoice_doc["invoice_header"]["pdf_base64"] = pdf_base64
            except Exception as e:
                print(f"Error processing with Gemini API: {e}")
                invoice_doc = extract_basic_invoice_details(message['payload'])
                invoice_doc["invoice_header"]["pdf_base64"] = pdf_base64
        else:
            invoice_doc = extract_basic_invoice_details(message['payload'])
        
        invoice_doc = convert_invoice_to_usd_and_status(invoice_doc)
        
        # Check for existing invoice
        existing_invoice = invoices_collection.find_one({"invoice_header.invoice_num": invoice_doc["invoice_header"]["invoice_num"]})
        if existing_invoice:
            print(f"Invoice {invoice_doc['invoice_header']['invoice_num']} already exists. Skipping.")
            return None
        
        # Insert into MongoDB
        result = invoices_collection.insert_one(invoice_doc)
        
        print(f"Successfully processed invoice: {invoice_doc['invoice_header']['invoice_num']}")
        return result.inserted_id
        
    except HttpError as error:
        print(f"An error occurred processing message {msg_id}: {error}")
        return None
    except Exception as e:
        print(f"Error processing email: {e}")
        return None

# ... rest of your existing code ... 