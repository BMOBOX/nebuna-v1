// app/signup/page.tsx ← JUST REPLACE YOUR FILE WITH THIS

"use client";

import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useSession, signIn } from "next-auth/react";

// Validation with username
const signupSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "At least 3 characters")
    .max(20, "Max 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscore")
    .required("Username required"),
  email: Yup.string().email("Invalid email").required("Email required"),
  password: Yup.string()
    .min(6, "Min 6 characters")
    .required("Password required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password"),
});

export default function Signup() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // ALL HOOKS AT THE TOP — NEVER AFTER ANY RETURN!
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: signupSchema,
    onSubmit: async (values) => {
      setErrorMsg("");
      setIsSubmitting(true);

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        username: values.username, // ← SENT TO authorize()
        action: "signup", // ← tells backend it's signup
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg(
          result.error.includes("duplicate")
            ? "Email or username already taken"
            : result.error
        );
      } else {
        router.push("/dashboard");
      }

      setIsSubmitting(false);
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  // EARLY RETURNS — SAFE (all hooks already called)
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Header showLogo={false} />
      <div className="w-96 rounded-xl bg-[#141414] p-8 text-white shadow-2xl">
        <h2 className="mb-2 text-center text-3xl font-bold">Sign up</h2>
        <p className="mb-8 text-center text-gray-500">Create your account</p>

        {errorMsg && (
          <p className="mb-4 rounded bg-red-900/30 py-2 text-center text-red-400">
            {errorMsg}
          </p>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          {/* USERNAME */}
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white ${
                formik.touched.username && formik.errors.username
                  ? "border-red-500"
                  : "border-gray-600"
              }`}
            />
            {formik.touched.username && formik.errors.username && (
              <p className="mt-1 text-sm text-red-400">
                {formik.errors.username}
              </p>
            )}
          </div>

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

          {/* CONFIRM PASSWORD */}
          <div>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full rounded-lg border bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white ${
                formik.touched.confirmPassword && formik.errors.confirmPassword
                  ? "border-red-500"
                  : "border-gray-600"
              }`}
            />
            {formik.touched.confirmPassword &&
              formik.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">
                  {formik.errors.confirmPassword}
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-white py-3.5 font-semibold text-black transition hover:bg-gray-100 disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <hr className="grow border-gray-700" />
          <span className="px-4 text-sm text-gray-500">or</span>
          <hr className="grow border-gray-700" />
        </div>

        <button
          onClick={() => signIn("google")}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-600 py-3.5 transition hover:bg-gray-900"
        >
          <FcGoogle className="text-2xl" />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
