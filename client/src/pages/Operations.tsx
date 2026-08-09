import DashboardLayout from "@/components/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Download,
  FileJson,
  Loader2,
  PauseCircle,
  PlugZap,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function downloadJson(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDate(value: unknown) {
  if (!value) return "Not changed yet";
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export default function Operations() {
  const utils = trpc.useUtils();
  const overview = trpc.operations.overview.useQuery();
  const supportBundle = trpc.operations.supportBundle.useQuery(undefined, {
    enabled: false,
  });
  const setControl = trpc.operations.setControl.useMutation();
  const exportMyData = trpc.operations.exportMyData.useMutation();
  const deleteMyData = trpc.operations.deleteMyData.useMutation();
  const [pauseReason, setPauseReason] = useState("");
  const [retentionDays, setRetentionDays] = useState(365);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    const control = overview.data?.operatorControl;
    if (!control) return;
    setPauseReason(control.pauseReason ?? "");
    setRetentionDays(control.retentionDays);
  }, [overview.data?.operatorControl]);

  const control = overview.data?.operatorControl;
  const paused = control?.outreachPaused ?? false;

  async function saveControl(nextPaused: boolean) {
    if (nextPaused && pauseReason.trim().length < 8) {
      toast.error("Describe the reason before pausing outreach.");
      return;
    }
    try {
      await setControl.mutateAsync({
        outreachPaused: nextPaused,
        reason: nextPaused ? pauseReason.trim() : undefined,
        retentionDays,
      });
      await utils.operations.overview.invalidate();
      toast.success(nextPaused ? "Outreach paused." : "Outreach resumed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Control update failed."
      );
    }
  }

  async function saveRetention() {
    try {
      await setControl.mutateAsync({
        outreachPaused: paused,
        reason: paused ? pauseReason.trim() : undefined,
        retentionDays,
      });
      await utils.operations.overview.invalidate();
      toast.success("Retention policy saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Policy update failed."
      );
    }
  }

  async function exportData() {
    try {
      const exported = await exportMyData.mutateAsync({
        personalDataAcknowledged: true,
      });
      downloadJson(`reachout-user-export-${Date.now()}.json`, exported);
      toast.success("Privacy export downloaded without secret values.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    }
  }

  async function exportSupportBundle() {
    const result = await supportBundle.refetch();
    if (!result.data) {
      toast.error("Support bundle could not be generated.");
      return;
    }
    downloadJson(`reachout-support-${Date.now()}.json`, result.data);
    toast.success("Redacted support bundle downloaded.");
  }

  async function confirmDeletion() {
    try {
      await deleteMyData.mutateAsync({ confirmation: "DELETE MY DATA" });
      toast.success("Account data deleted.");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deletion failed.");
    }
  }

  if (overview.isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-sm text-muted-foreground">
          Loading operations status...
        </div>
      </DashboardLayout>
    );
  }

  if (!overview.data) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Operations status unavailable</AlertTitle>
          <AlertDescription>
            Refresh the page. Consequential outreach actions remain fail-closed
            when their safety checks cannot be loaded.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const data = overview.data;
  const deletePhrase = data.privacy.accountDeleteConfirmation;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Operations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Runtime safety, provider readiness, privacy, and recovery
              controls.
            </p>
          </div>
          <Badge
            variant={
              data.runtime.mode === "development" ? "secondary" : "outline"
            }
          >
            {data.environment.label}
          </Badge>
        </div>

        {paused ? (
          <Alert variant="destructive">
            <PauseCircle />
            <AlertTitle>All outreach is paused</AlertTitle>
            <AlertDescription>
              Discovery, campaign resume, message approval, send recording, and
              scheduled execution are blocked. {control?.pauseReason}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <ShieldCheck />
            <AlertTitle>Outreach controls are active</AlertTitle>
            <AlertDescription>
              External delivery remains assisted and requires approval plus
              operator-provided delivery evidence.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Emergency stop</CardTitle>
              <CardDescription>
                A server-enforced stop for consequential outreach actions and
                scheduled discovery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="pause-reason">Reason</FieldLabel>
                  <Input
                    id="pause-reason"
                    value={pauseReason}
                    onChange={event => setPauseReason(event.target.value)}
                    maxLength={500}
                    placeholder="Example: provider policy review in progress"
                  />
                  <FieldDescription>
                    Required when pausing and included in blocked-action
                    feedback.
                  </FieldDescription>
                </Field>
                <Field orientation="horizontal">
                  <div>
                    <FieldLabel htmlFor="outreach-pause">
                      Pause outreach
                    </FieldLabel>
                    <FieldDescription>
                      Last changed {formatDate(control?.updatedAt)}
                    </FieldDescription>
                  </div>
                  <Switch
                    id="outreach-pause"
                    checked={paused}
                    disabled={setControl.isPending}
                    onCheckedChange={saveControl}
                    aria-label="Pause all outreach"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Provider reality</CardTitle>
              <CardDescription>
                Connection state is reported independently from public
                discovery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Configured</dt>
                  <dd className="mt-1 text-2xl font-semibold">
                    {data.providers.configured}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Verified</dt>
                  <dd className="mt-1 text-2xl font-semibold">
                    {data.providers.verified}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Campaigns</dt>
                  <dd className="mt-1 text-2xl font-semibold">
                    {data.data.campaigns}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Review needed</dt>
                  <dd className="mt-1 text-2xl font-semibold">
                    {data.data.candidatesNeedingReview}
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-sm text-muted-foreground">
                {data.providers.note}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retention and diagnostics</CardTitle>
              <CardDescription>
                Set the documented retention target and export a secret-free
                support snapshot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="retention-days">
                    Retention target in days
                  </FieldLabel>
                  <Input
                    id="retention-days"
                    type="number"
                    min={30}
                    max={3650}
                    value={retentionDays}
                    onChange={event =>
                      setRetentionDays(Number(event.target.value))
                    }
                  />
                  <FieldDescription>
                    This policy is recorded for operators; automated destructive
                    cleanup is intentionally not enabled.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button onClick={saveRetention} disabled={setControl.isPending}>
                {setControl.isPending ? (
                  <Loader2 data-icon="inline-start" />
                ) : null}
                Save policy
              </Button>
              <Button variant="outline" onClick={exportSupportBundle}>
                <FileJson data-icon="inline-start" />
                Support bundle
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlugZap className="size-5" aria-hidden="true" />
                HAI connector
              </CardTitle>
              <CardDescription>
                Read-only operational context for Human Artificial Intelligence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={
                    data.integrations.hai.configured ? "default" : "secondary"
                  }
                >
                  {data.integrations.hai.configured
                    ? "Ready"
                    : data.integrations.hai.enabled
                      ? "Setup needed"
                      : "Disabled"}
                </Badge>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Scope</dt>
                  <dd className="text-right">Aggregate, read only</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Candidate PII</dt>
                  <dd className="text-right">Excluded</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Feed</dt>
                  <dd className="break-all text-right font-mono text-xs">
                    {data.integrations.hai.feedPath}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy controls</CardTitle>
              <CardDescription>
                Export current-user data or permanently remove the account and
                all owned campaign records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Exports exclude passwords, API keys, encrypted secret values,
                and stored sessions. Deletion requires the emergency stop first.
              </p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={exportData}
                disabled={exportMyData.isPending}
              >
                <Download data-icon="inline-start" />
                Export my data
              </Button>
              <AlertDialog
                onOpenChange={open => !open && setDeleteConfirmation("")}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!paused}>
                    <Trash2 data-icon="inline-start" />
                    Delete my data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete all account data?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes campaigns, candidates, messages,
                      credentials, audit records, queue records, and the user
                      account. Type {deletePhrase} to continue.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Field>
                    <FieldLabel htmlFor="delete-confirmation">
                      Confirmation
                    </FieldLabel>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={event =>
                        setDeleteConfirmation(event.target.value)
                      }
                      autoComplete="off"
                    />
                  </Field>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className={buttonVariants({ variant: "destructive" })}
                      disabled={
                        deleteConfirmation !== deletePhrase ||
                        deleteMyData.isPending
                      }
                      onClick={event => {
                        event.preventDefault();
                        void confirmDeletion();
                      }}
                    >
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
