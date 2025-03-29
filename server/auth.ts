import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { storage } from './storage';
import { GoogleUser } from '@shared/schema';
import MongoStore from 'connect-mongo';

// Configure Passport to use Google Strategy
export function setupAuth(app: Express): void {
  // Verify we have necessary environment variables
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
  const sessionSecret = process.env.SESSION_SECRET || 'invoice-automation-secret';
  const mongoUri = process.env.MONGO_URI || "***REMOVED***";

  if (!clientID || !clientSecret) {
    console.warn('Missing Google OAuth credentials. Auth will not work properly.');
    return;
  }

  // Set up session management
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
      mongoUrl: mongoUri,
      collectionName: 'sessions'
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === 'production'
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google Strategy
  passport.use(new GoogleStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: callbackURL,
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists in our database
      let user = await storage.getGoogleUserById(profile.id);
      
      // If not, create a new user
      if (!user) {
        const newUser: GoogleUser = {
          id: profile.id,
          email: profile.emails?.[0].value || '',
          displayName: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          profileImageUrl: profile.photos?.[0].value,
          accessToken: accessToken,
          refreshToken: refreshToken,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        user = await storage.createGoogleUser(newUser);
      } else {
        // Update the access token
        await storage.updateGoogleUser(profile.id, { 
          accessToken, 
          refreshToken: refreshToken || user.refreshToken,
          updatedAt: new Date() 
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, (user as GoogleUser).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getGoogleUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Define authentication routes
  app.get('/api/auth/google', passport.authenticate('google'));

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/auth',
      successRedirect: '/' 
    })
  );

  app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to log out' });
      }
      // Return a JSON response for API clients
      res.status(200).json({ success: true, message: 'Successfully logged out' });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      // Remove sensitive information before sending to client
      const user = req.user as GoogleUser;
      const safeUser = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      };
      return res.json(safeUser);
    }
    return res.status(401).json({ error: 'Not authenticated' });
  });

  // Middleware to check authentication
  app.use('/api/invoices/user', ensureAuthenticated);
  app.use('/api/gmail', ensureAuthenticated);
}

// Middleware to ensure user is authenticated
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ error: 'Authentication required' });
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface User extends GoogleUser {}
  }
}