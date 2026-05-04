import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Admin from "./pages/Admin";
import Studio from "./pages/Studio";
import Gallery from "./pages/Gallery";
import Pricing from "./pages/Pricing";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Marketplace from "./pages/Marketplace";
import AdminDashboard from "./pages/AdminDashboard";
import WebhookConsole from "./pages/WebhookConsole";
import VerifyEmail from "./pages/VerifyEmail";
import Onboarding from "./pages/Onboarding";
import Referrals from "./pages/Referrals";
import { APIDocumentation } from "./components/APIDocumentation";
import { AdvancedAnalyticsDashboard } from "./components/AdvancedAnalyticsDashboard";
import { IntegrationSettings } from "./components/IntegrationSettings";
import { DeploymentMonitor } from "./components/DeploymentMonitor";
import { RollbackRevertUI } from "./components/RollbackRevertUI";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/studio" component={Studio} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/admin" component={Admin} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/webhook-console" component={WebhookConsole} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/api-docs" component={() => <APIDocumentation endpoints={[]} />} />
      <Route path="/analytics-dashboard" component={() => <AdvancedAnalyticsDashboard />} />
      <Route path="/integrations" component={() => <IntegrationSettings />} />
      <Route path="/deployments" component={() => <DeploymentMonitor projectId={0} />} />
      <Route path="/rollback" component={() => <RollbackRevertUI deployments={[]} commits={[]} onRollback={async () => {}} onRevert={async () => {}} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#111117",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fafafa",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
