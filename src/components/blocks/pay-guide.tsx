"use client"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function TelebirrGuide() {
  const steps = [
    {
      title: "Step 1: Open Telebirr App",
      description:
        "Open the Telebirr app then click 'Transfer to Bank' on the main page.",
      image: "/tb-cbe-1.png",
    },
    {
      title: "Step 2: Choose Bank",
      description: "Choose a bank: Commercial Bank of Ethiopia.",
      image: "/tb-cbe-2.png",
    },
    {
      title: "Step 3: Enter Account Number",
      description:
        "Insert bank account number 1000384492014 and click next.",
      image: "/tb-cbe-3.png",
    },
    {
      title: "Step 4: Enter Exact Amount",
      description: (
        <>
          Insert the exact amount for your purchase. Inserting less or more
          amount will be rejected and you need to contact admin{" "}
          <a
            href="https://t.me/amanxhana"
            className="text-primary underline font-medium"
          >
            Admin
          </a>
          .
        </>
      ),
      image: "/tb-cbe-4.png",
    },
    {
      title: "Step 5: Verify in Checkout",
      description:
        "In the checkout, insert the receipt text or URL to verify and place orders.",
      image: "/tb-cbe-5.png",
    },
  ]

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <Carousel className="w-full min-w-0">
        <CarouselContent className="-ml-0 w-full">
          {steps.map((step, index) => (
            <CarouselItem key={index} className="w-full min-w-0 pl-0">
              <div className="flex w-full min-w-0 flex-col items-center space-y-3 px-2">
                <div className="relative flex h-64 w-full max-w-[200px] items-center justify-center overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={`/guide/${step.image}`}
                    alt={step.title}
                    width={200}
                    height={400}
                    className="h-full w-auto max-w-full object-contain"
                    priority={index === 0}
                  />
                </div>
                <div className="w-full min-w-0 space-y-2 text-center">
                  <h3 className="break-words text-sm font-semibold leading-tight">
                    {step.title}
                  </h3>
                  <p className="whitespace-normal break-words text-xs leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="mt-4 flex justify-center gap-3 pb-2">
          <CarouselPrevious className="relative static transform-none" />
          <CarouselNext className="relative static transform-none" />
        </div>
      </Carousel>
    </div>
  )
}

export function CbeGuide() {
  return (
    <div className="w-full min-w-0 space-y-4 text-sm">
      <ol className="list-inside list-decimal space-y-4 marker:font-semibold marker:text-primary">
        <li className="break-words pl-2">First, open the CBE app.</li>
        <li className="break-words pl-2">
          Insert the exact amount for your purchase.{" "}
          <span className="font-medium text-destructive">
            Inserting less or more amount will be rejected and you need to
            contact admin{" "}
            <a
              href="https://t.me/amanxhana"
              className="font-medium text-primary underline"
            >
              Admin
            </a>
            .
          </span>
        </li>
        <li className="break-words pl-2">
          Then, transfer the money to the designated account.
        </li>
        <li className="break-words pl-2">
          Come back here, then insert your transaction receipt URL or text, and
          your CBE account number in the checkout form.
        </li>
        <li className="break-words pl-2">
          Click verify to verify and place the order.
        </li>
      </ol>
      <div className="mt-6 rounded-md border bg-muted p-4">
        <p className="mb-1 text-sm font-medium">For any support, contact:</p>
        <a
          href="https://t.me/amanxhana"
          className="font-medium text-primary underline transition-colors hover:text-primary/80"
        >
          @amanxhana
        </a>
      </div>
    </div>
  )
}

export default function GuideBtn() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Payment Guide
          </Button>
        }
      />
      <DialogContent
        className="
          max-h-[90vh]
          w-[calc(100vw-2rem)]
          overflow-x-hidden overflow-y-auto
          p-4
          sm:w-full sm:max-w-[600px] sm:p-6
        "
      >
        <DialogHeader>
          <DialogTitle>Payment Guide</DialogTitle>
          <DialogDescription>
            There are 2 ways to pay: from Telebirr to CBE account (Telebirr
            method) or from CBE account to CBE account (CBE method). Follow the
            steps below to complete your payment.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="telebirr" className="mt-4 w-full min-w-0">
          <TabsList className="grid w-full max-w-full grid-cols-2">
            <TabsTrigger value="telebirr" className="text-xs sm:text-sm">
              Telebirr Method
            </TabsTrigger>
            <TabsTrigger value="cbe" className="text-xs sm:text-sm">
              CBE Method
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="telebirr"
            className="mt-4 w-full min-w-0 overflow-hidden focus-visible:outline-none"
          >
            <TelebirrGuide />
          </TabsContent>
          <TabsContent
            value="cbe"
            className="mt-4 w-full min-w-0 overflow-hidden focus-visible:outline-none"
          >
            <CbeGuide />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}