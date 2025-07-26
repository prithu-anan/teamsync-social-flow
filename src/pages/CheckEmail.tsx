import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CheckEmail = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-teamsync-800 to-teamsync-700 p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              If an account with that email exists, a password reset link has been sent. Please check your inbox and follow the instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-teamsync-700 mt-4">
              Didn&apos;t receive the email? Please check your spam folder or try again.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Go back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CheckEmail; 