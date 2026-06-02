import { Layout } from "@/components/layout";
import {
  useGetEvalResults,
  useRunEval,
  getGetEvalResultsQueryKey,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Target,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function EvalPage() {
  const queryClient = useQueryClient();
  const { data: evalResults, isLoading } = useGetEvalResults({
    query: { queryKey: getGetEvalResultsQueryKey() },
  });

  const runEval = useRunEval();

  const handleRunEval = () => {
    runEval.mutate(
      { data: {} },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetEvalResultsQueryKey(),
          });
        },
      },
    );
  };

  const isRunning = runEval.isPending;

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <header className="px-6 py-6 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
              <Activity className="w-6 h-6 text-primary" />
              Agent Evaluation Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Measure accuracy, routing precision, and latency across
              specialized financial domains.
            </p>
          </div>
          <Button
            onClick={handleRunEval}
            disabled={isRunning}
            className="hover-elevate shadow-sm"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Running Suite...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Run Eval Suite
              </span>
            )}
          </Button>
        </header>

        <ScrollArea className="flex-1 p-6 bg-muted/20">
          <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {!evalResults && isLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : !evalResults ? (
              <Card className="border-dashed border-2 bg-transparent mt-12">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No evaluation data yet
                  </h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Run the evaluation suite to measure the AI agent's
                    performance across different financial domains.
                  </p>
                  <Button
                    onClick={handleRunEval}
                    disabled={isRunning}
                    variant="default"
                    size="lg"
                  >
                    Run First Evaluation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-card shadow-sm border-border">
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Overall Pass Rate
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div
                          className={`text-4xl font-bold tracking-tight ${evalResults.pass_rate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                        >
                          {Math.round(evalResults.pass_rate)}%
                        </div>
                      </div>
                      <Progress
                        value={evalResults.pass_rate}
                        className="h-2 mt-4"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-sm border-border">
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Total Tests
                      </div>
                      <div className="text-4xl font-bold tracking-tight">
                        {evalResults.total_tests}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4" />{" "}
                          {evalResults.passed}
                        </span>
                        <span className="flex items-center gap-1 text-destructive font-medium">
                          <XCircle className="w-4 h-4" /> {evalResults.failed}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-sm border-border">
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Avg Latency
                      </div>
                      <div className="text-4xl font-bold tracking-tight flex items-baseline gap-1">
                        {Math.round(evalResults.avg_latency_ms)}
                        <span className="text-lg text-muted-foreground font-normal">
                          ms
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Response time
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card shadow-sm border-border">
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Last Run
                      </div>
                      <div className="text-xl font-medium tracking-tight mb-1">
                        {new Date(evalResults.ran_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(evalResults.ran_at).toLocaleTimeString()}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground/70 mt-3 truncate">
                        ID: {evalResults.run_id.split("-")[0]}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Category Scores */}
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle>Domain Performance</CardTitle>
                    <CardDescription>
                      Accuracy routing to specialized agents by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
                      {Object.entries(evalResults.category_scores).map(
                        ([category, score]: [string, number]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex justify-between items-end text-sm">
                              <span className="font-medium capitalize">
                                {category.replace(/_/g, " ")}
                              </span>
                              <span
                                className={
                                  score >= 80
                                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                    : "text-muted-foreground font-medium"
                                }
                              >
                                {Math.round(score)}%
                              </span>
                            </div>
                            <Progress value={score} className="h-1.5" />
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Results */}
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle>Detailed Test Results</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                          <tr>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Query</th>
                            <th className="px-6 py-3 font-medium">Category</th>
                            <th className="px-6 py-3 font-medium">Routing</th>
                            <th className="px-6 py-3 font-medium text-right">
                              Latency
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {evalResults.results.map(
                            (result: (typeof evalResults.results)[0]) => (
                              <tr
                                key={result.test_id}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  {result.passed ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                                    >
                                      Pass
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30"
                                    >
                                      Fail
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-6 py-4 max-w-md">
                                  <div
                                    className="font-medium truncate"
                                    title={result.query}
                                  >
                                    {result.query}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate mt-1">
                                    {result.response_preview}
                                  </div>
                                </td>
                                <td className="px-6 py-4 capitalize whitespace-nowrap">
                                  {result.category.replace(/_/g, " ")}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-muted-foreground w-16">
                                        Expected:
                                      </span>
                                      <span className="font-medium">
                                        {result.expected_agent}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-muted-foreground w-16">
                                        Actual:
                                      </span>
                                      <span
                                        className={`font-medium ${result.expected_agent === result.actual_agent ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                                      >
                                        {result.actual_agent}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-muted-foreground whitespace-nowrap">
                                  {result.latency_ms}ms
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
}
