import { SignUp } from "@clerk/nextjs";
export default function Page() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center mb-8 absolute top-8 left-0 right-0">
        <h1 className="text-2xl font-bold"><span className="text-text-primary">AI</span><span className="gradient-text"> Digital Library</span></h1>
      </div>
      <SignUp appearance={{ variables: { colorPrimary: "#7c5cbf", colorBackground: "#111118", colorText: "#f0eeff", colorTextSecondary: "#a09bb8", colorInputBackground: "#22223a", colorInputText: "#f0eeff" }, elements: { card: "bg-surface-2 border border-border shadow-2xl", formButtonPrimary: "btn-gradient" } }} />
    </div>
  );
}
