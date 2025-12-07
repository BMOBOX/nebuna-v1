"use client";

import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useSession, signIn } from "next-auth/react";
import { toast } from "react-toastify";

// Validation schema
const signinSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email required"),
  password: Yup.string()
    .min(6, "Min 6 characters")
    .required("Password required"),
});

export default function Signin() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");
    if (error) {
      toast.error("Google sign-in failed!");
      router.replace("/signin"); // removes query string
    }
  }, [router]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard/portfolio");
    }
  }, [status, router]);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: signinSchema,
    onSubmit: async (values) => {
      setErrorMsg("");
      setIsSubmitting(true);

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Wrong email or password!");
        console.error(result.error);
        return;
      }

      toast.success("Signed in successfully!");
      router.push("/dashboard/portfolio"); // redirect first
      // do not set isSubmitting false here, component will unmount
    },
  });
  const handleGoogleSignIn = async () => {
    const result = await signIn("google", { redirect: false });
    if (result?.ok) {
      router.push("/dashboard/portfolio");
    }
  };

  // Early returns
  if (status === "loading" || isSubmitting) {
    return;
  }

  if (status === "authenticated") return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Header showLogo={false} />
      <div className="w-96 rounded-xl bg-[#141414] p-8 text-white shadow-2xl">
        <h2 className="mb-2 text-center text-3xl font-bold">Sign in</h2>
        <p className="mb-8 text-center text-gray-500">Welcome back!</p>

        {errorMsg && (
          <p className="mb-4 rounded bg-red-900/30 py-2 text-center text-red-400">
            {errorMsg}
          </p>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          {/* EMAIL */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white ${
                formik.touched.email && formik.errors.email
                  ? "border-red-500"
                  : "border-gray-600"
              }`}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1 text-sm text-red-400">{formik.errors.email}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white ${
                formik.touched.password && formik.errors.password
                  ? "border-red-500"
                  : "border-gray-600"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-gray-400"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
            {formik.touched.password && formik.errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {formik.errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full p-3 rounded-md transition cursor-pointer ${
              isSubmitting
                ? "bg-zinc-800/70 border-700 cursor-not-allowed"
                : "bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700"
            }`}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <hr className="grow border-gray-700" />
          <span className="px-4 text-sm text-gray-500">or</span>
          <hr className="grow border-gray-700" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-600 py-3.5 transition hover:bg-gray-900 cursor-pointer"
        >
          <FcGoogle className="text-2xl" />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
