import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.email?.[0] || "Registration failed");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex items-center justify-center p-4">
      {/* Background — matches Landing theme */}
      <div className="fixed inset-0 z-[-2] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,243,255,0.08),transparent)]" />
      <div className="fixed top-[15%] right-[5%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] z-[-1]" />
      <div className="fixed bottom-[10%] left-[5%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] z-[-1]" />
      <div className="fixed top-[60%] right-[20%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] z-[-1]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="glass border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
          <CardHeader className="space-y-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-2 w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center text-black font-black text-2xl shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                N
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center font-heading text-white">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Join NeuroTutor and start learning smarter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none text-foreground"
                  htmlFor="name"
                >
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-black/30 border-white/10 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none text-foreground"
                  htmlFor="email"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="enter@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-black/30 border-white/10 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none text-foreground"
                  htmlFor="password"
                >
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-black/30 border-white/10 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none text-foreground"
                  htmlFor="password_confirm"
                >
                  Confirm Password
                </label>
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  required
                  className="bg-black/30 border-white/10 focus-visible:ring-primary"
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold hover:from-cyan-500/90 hover:to-blue-600/90 shadow-[0_0_20px_rgba(0,243,255,0.25)]"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5">
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
