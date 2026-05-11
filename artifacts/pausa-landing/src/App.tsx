import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CLERK_PUBLISHABLE_KEY, isClerkConfigured } from "@/lib/clerk-config";
import Home from "@/pages/Home";
import SignInPage from "@/pages/SignIn";
import SignUpPage from "@/pages/SignUp";
import OnboardingPage from "@/pages/Onboarding";
import CommunityPage from "@/pages/Community";
import CommunityPostPage from "@/pages/CommunityPost";
import AskQuestionPage from "@/pages/AskQuestion";
import DashboardPage from "@/pages/Dashboard";
import AIAdvisorPage from "@/pages/AIAdvisor";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function Routes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-in/sso-callback" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/sign-up/sso-callback" component={SignUpPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/community/ask" component={AskQuestionPage} />
      <Route path="/community/:id" component={CommunityPostPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/advisor" component={AIAdvisorPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppCore() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Routes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  if (isClerkConfigured) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <AppCore />
      </ClerkProvider>
    );
  }
  return <AppCore />;
}
