// app/signin/SigninClient.tsx   (or wherever your signin page lives)
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { signIn, useSession } from "next-auth/react";
import { toast } from "react-toastify";

// ←←← This tiny wrapper fixes everything
function SearchParamsHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");

    if (error === "duplicate_email") {
      toast.error("An account with this email already exists. Please sign in.");
      redirect("/signin");
    } else if (error === "OAuthSignin" || error === "OAuthCallback") {
      toast.error("Failed to sign in with Google.");
      redirect("/signin");
    }
  }, [searchParams]);

  return null;
}

// ←←← Your actual sign-in page (unchanged logic)
function SigninContent() {
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  if (status === "authenticated") {
    redirect("/dashboard");
  }

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(6, "Password too short")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (res?.error) {
        toast.error(
          res.error === "CredentialsSignin"
            ? "Wrong email or password!"
            : res.error
        );
        setIsSubmitting(false);
        return;
      }

      toast.success("Signed in successfully!");
      redirect("/dashboard");
    },
  });

  return (
    <>
      <Header showLogo={false} />

      <div className="flex justify-center items-center h-screen bg-black">
        <div className="bg-[#141414] text-white p-8 rounded-xl w-96 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-2">Sign in</h2>
          <p className="text-gray-500 text-center mb-6">Welcome back!</p>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Your entire form exactly as you had it */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              className={`w-full p-3 bg-transparent border rounded-md focus:ring-2 focus:ring-gray-400 ${
                formik.touched.email && formik.errors.email
                  ? "border-red-500"
                  : "border-gray-600"
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className={`w-full p-3 bg-transparent border rounded-md focus:ring-2 focus:ring-gray-400 ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500"
                    : "border-gray-600"
                }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-4 text-gray-400"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full p-3 rounded-md transition ${
                isSubmitting
                  ? "bg-zinc-800/70 cursor-not-allowed"
                  : "bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700"
              }`}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="flex items-center my-4">
            <hr className="grow border-gray-600" />
            <span className="mx-2 text-gray-400">or</span>
            <hr className="grow border-gray-600" />
          </div>

          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2 p-3 border border-gray-600 rounded-md hover:bg-gray-800 transition"
          >
            <FcGoogle className="text-xl" /> Continue with Google
          </button>

          <p className="text-center text-gray-400 mt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

// ←←← The only thing that matters: wrap the handler in Suspense
export default function SigninClient() {
  return (
    <>
      <Suspense>
        <SearchParamsHandler />
      </Suspense>
      <SigninContent />
    </>
  );
}
