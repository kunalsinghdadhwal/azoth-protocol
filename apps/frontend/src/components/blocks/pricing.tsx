import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Swap",
    monthlyPrice: "0.3%",
    yearlyPrice: "0.3%",
    description: "Per transaction fee",
    features: [
      "Encrypted swap amounts",
      "MEV protection",
      "Confidential ERC-20 support",
      "Instant settlement",
    ],
  },
  {
    name: "Liquidity",
    monthlyPrice: "0.25%",
    yearlyPrice: "0.25%",
    features: [
      "All swap features and...",
      "Hidden LP positions",
      "Private fee accrual",
      "Encrypted LP token minting",
      "Impermanent loss protection",
      "Priority withdrawals",
    ],
  },
  {
    name: "Institutional",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    features: [
      "All liquidity features and...",
      "Dedicated pool deployment",
      "Custom slippage parameters",
      "Audit & compliance reports",
      "24/7 support",
    ],
  },
];

export const Pricing = ({ className }: { className?: string }) => {
  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container max-w-5xl">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
            Protocol Fees
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl leading-snug text-balance">
            Transparent fee structure with no hidden costs. All fees go to
            liquidity providers and protocol development.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-5 text-start md:mt-12 md:grid-cols-3 lg:mt-20">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`${
                plan.name === "Liquidity"
                  ? "outline-primary origin-top outline-4"
                  : ""
              }`}
            >
              <CardContent className="flex flex-col gap-7 px-6 py-5">
                <div className="space-y-2">
                  <h3 className="text-foreground font-semibold">{plan.name}</h3>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-lg font-medium">
                      {plan.monthlyPrice}{" "}
                      {plan.name !== "Institutional" && (
                        <span className="text-muted-foreground">
                          fee
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-muted-foreground text-sm">
                  {plan.description}
                </span>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="text-muted-foreground flex items-center gap-1.5"
                    >
                      <Check className="size-5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-fit"
                  variant={plan.name === "Liquidity" ? "default" : "outline"}
                >
                  {plan.name === "Institutional" ? "Contact Us" : "Start Trading"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
