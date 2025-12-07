"use client";

import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { signIn, useSession } from "next-auth/react";
import { toast } from "react-toastify";

const signinSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password too short")
    .required("Password is required"),
});

export default function Signin() {
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already signed in
  if (status === "authenticated") {
    redirect("/dashboard");
  }

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: signinSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);

      try {
        const result = await signIn("credentials", {
          redirect: false,
          email: values.email,
          password: values.password,
        });

        if (result?.error) {
          // Map NextAuth error to friendly message
          let msg = result.error;
          if (msg === "CredentialsSignin") msg = "Wrong email or password!";
          toast.error(msg);
          setIsSubmitting(false);
          return;
        }

        toast.success("Signed in successfully!");
        redirect("/dashboard");
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
      }
    },
  });

  return (
    <>
      <Header showLogo={false} />

      <div className="flex justify-center items-center h-screen bg-black">
        <div className="bg-[#141414] text-white p-8 rounded-xl w-96 shadow-lg">
          <h2 className="text-2xl font-bold text-center">Sign in</h2>
          <p className="text-gray-500 text-center mb-6">Welcome back!</p>

          <form className="space-y-4" onSubmit={formik.handleSubmit}>
            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full p-3 bg-transparent border ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : "border-gray-600"
                } rounded-md focus:ring-2 focus:ring-gray-400`}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full p-3 bg-transparent border ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500"
                    : "border-gray-600"
                } rounded-md focus:ring-2 focus:ring-gray-400`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-4 text-gray-400 cursor-pointer"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="text-right mt-1">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`w-full p-3 rounded-md transition cursor-pointer ${
                isSubmitting
                  ? "bg-zinc-800/70 border-700 cursor-not-allowed"
                  : "bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700"
              }`}
              disabled={isSubmitting}
              onClick={() => {
                // Show Formik errors in toast
                Object.keys(formik.errors).forEach((key) => {
                  if (formik.touched[key as keyof typeof formik.touched]) {
                    toast.error(
                      formik.errors[key as keyof typeof formik.errors]
                    );
                  }
                });
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4">
            <hr className="grow border-gray-600" />
            <span className="text-gray-400 mx-2">or</span>
            <hr className="grow border-gray-600" />
          </div>

          {/* Google login */}
          <button
            className="w-full flex items-center justify-center gap-2 p-3 border border-gray-600 rounded-md hover:bg-gray-800 transition cursor-pointer"
            onClick={() => signIn("google")}
          >
            <FcGoogle className="text-xl" /> Continue with Google
          </button>

          {/* Signup */}
          <p className="text-gray-400 text-center mt-4">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-500 cursor-pointer hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
