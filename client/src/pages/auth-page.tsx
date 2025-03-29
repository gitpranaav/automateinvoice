import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left side - login form */}
      <div className="flex-1 p-8 flex flex-col justify-center items-center bg-white dark:bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
            <p className="mt-2 text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                Choose your sign-in method to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <a href="/api/auth/google" className="w-full">
                  <Button className="w-full flex items-center justify-center space-x-2" variant="outline">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="mr-2">
                      <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
                      <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
                      <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1272727,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
                      <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
                    </svg>
                    Sign in with Google
                  </Button>
                </a>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Secure authentication powered by Google</p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Right side - hero section */}
      <div className="flex-1 p-8 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 hidden md:flex flex-col justify-center">
        <div className="max-w-lg mx-auto space-y-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-primary text-primary-foreground">
              <FileSpreadsheet size={24} />
            </div>
            <h2 className="text-2xl font-bold">Invoice Management System</h2>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Streamline Your Invoice Processing</h3>
            <p className="text-muted-foreground">
              Our platform helps you manage and analyze all your invoices in one place, with powerful features for finance professionals.
            </p>
            
            <ul className="space-y-2">
              {[
                "Automatic Gmail invoice detection",
                "PDF data extraction with AI",
                "Comprehensive analytics dashboard",
                "Invoice management and organization"
              ].map((feature, i) => (
                <li key={i} className="flex items-center space-x-2">
                  <ArrowRight size={16} className="text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}