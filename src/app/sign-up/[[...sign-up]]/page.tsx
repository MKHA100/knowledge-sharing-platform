import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl rounded-2xl border border-blue-100",
            headerTitle: "text-slate-900",
            headerSubtitle: "text-slate-500",
            formButtonPrimary:
              "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
          },
        }}
        forceRedirectUrl="/?welcome=signup"
        signInUrl="/sign-in"
      />
    </div>
  );
}
