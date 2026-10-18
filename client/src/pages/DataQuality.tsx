import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Database, Mail, Phone, Users } from "lucide-react";
import { Link } from "wouter";

const FIELD_COLUMNS = [
  ["email", "Email"],
  ["phone", "Phone"],
  ["profileUrl", "Profile"],
  ["location", "Location"],
  ["experience", "Experience"],
  ["services", "Services"],
  ["availability", "Availability"],
  ["hourlyRate", "Rate"],
  ["bio", "Bio"],
] as const;

function percentage(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function completenessBadgeVariant(score: number) {
  if (score >= 75) return "default" as const;
  if (score >= 45) return "secondary" as const;
  return "destructive" as const;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default function DataQuality() {
  const { data, isLoading } = trpc.candidates.dataQuality.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-sm text-muted-foreground">
          Loading data quality...
        </div>
      </DashboardLayout>
    );
  }

  const summary = data ?? {
    totalCandidates: 0,
    directContactCandidates: 0,
    averageCompleteness: 0,
    fields: {},
    platforms: [],
  };
  const directContactCoverage = percentage(
    summary.directContactCandidates,
    summary.totalCandidates
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Data Quality
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Check which sources provide enough profile data for informed,
              approval-gated outreach.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/candidates">Review candidates</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/platforms">Platform access</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Candidates"
            value={summary.totalCandidates}
            detail="Across your campaigns"
            icon={Users}
          />
          <MetricCard
            label="Direct contact"
            value={`${directContactCoverage}%`}
            detail={`${summary.directContactCandidates} with email or phone`}
            icon={Phone}
          />
          <MetricCard
            label="Profile completeness"
            value={`${summary.averageCompleteness}%`}
            detail="Across nine useful profile fields"
            icon={Database}
          />
        </div>

        {summary.totalCandidates === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No candidate data yet</CardTitle>
              <CardDescription>
                Run a discovery pass or import candidates to see source-level
                completeness here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/campaigns">Open campaigns</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Completeness by source</CardTitle>
              <CardDescription>
                Percentages are calculated from saved candidate records, not
                from scraped page data or credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Candidates</TableHead>
                    <TableHead className="text-right">Direct contact</TableHead>
                    <TableHead className="text-right">Complete</TableHead>
                    {FIELD_COLUMNS.map(([, label]) => (
                      <TableHead key={label} className="text-right">
                        {label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.platforms.map(platform => (
                    <TableRow key={platform.platformId}>
                      <TableCell className="font-medium">
                        {platform.platformName}
                      </TableCell>
                      <TableCell className="text-right">
                        {platform.totalCandidates}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {percentage(
                            platform.directContactCandidates,
                            platform.totalCandidates
                          )}
                          %
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={completenessBadgeVariant(
                            platform.completeness
                          )}
                        >
                          {platform.completeness}%
                        </Badge>
                      </TableCell>
                      {FIELD_COLUMNS.map(([field, label]) => {
                        const value = platform.fields[field] ?? 0;
                        const fieldPercentage = percentage(
                          value,
                          platform.totalCandidates
                        );
                        return (
                          <TableCell key={label} className="text-right">
                            <span className="inline-flex items-center gap-1">
                              {fieldPercentage >= 75 ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              ) : null}
                              {fieldPercentage}%
                            </span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
