"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Founder } from "@/lib/kpi-engine";
import { Plus, Trash2, ArrowRight } from "lucide-react";

interface FounderSetupProps {
  founders: Founder[];
  setFounders: (founders: Founder[]) => void;
  onComplete: () => void;
}

export function FounderSetup({
  founders,
  setFounders,
  onComplete,
}: FounderSetupProps) {
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");

  function addFounder() {
    if (!newName.trim() || !newRole.trim()) return;
    const founder: Founder = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      role: newRole.trim(),
      kpis: [],
    };
    setFounders([...founders, founder]);
    setNewName("");
    setNewRole("");
  }

  function removeFounder(id: string) {
    setFounders(founders.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Who are the founders?
        </h2>
        <p className="text-muted-foreground mt-1">
          Add each founding team member and their primary role. The AI will help
          tailor KPIs based on responsibilities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Founder</CardTitle>
          <CardDescription>
            Enter each founder&apos;s name and primary role in the company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFounder()}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="role">Primary Role</Label>
              <Input
                id="role"
                placeholder="CEO, CTO, CPO..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFounder()}
              />
            </div>
            <Button onClick={addFounder} disabled={!newName || !newRole}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {founders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Founding Team ({founders.length})
          </h3>
          {founders.map((founder) => (
            <Card key={founder.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{founder.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {founder.role}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFounder(founder.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {founders.length >= 2 && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg">
            Define KPIs
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {founders.length === 1 && (
        <p className="text-sm text-muted-foreground text-center">
          Add at least one more founder to proceed.
        </p>
      )}
    </div>
  );
}
