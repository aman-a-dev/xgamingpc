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
      description: "Open the Telebirr app then click 'Transfer to Bank' on the main page.",
      image: "/tb-cbe-1.png",
    },
    {
      title: "Step 2: Choose Bank",
      description: "Choose a bank: Commercial Bank of Ethiopia.",
      image: "/tb-cbe-2.png",
    },
    {
      title: "Step 3: Enter Account Number",
      description: "Insert bank account number 1000384492014 and click next.",
      image: "/tb-cbe-3.png",
    },
    {
      title: "Step 4: Enter Exact Amount",
      description: (
        <>
          Insert the exact amount for your purchase. Inserting less or more amount will be rejected and you need to contact admin{" "}
          <a href="https://t.me/amanxhana" className="text-primary underline font-medium">
            Admin
          </a>
          .
        </>
      ),
      image: "/tb-cbe-4.png",
    },
    {
      title: "Step 5: Verify in Checkout",
      description: "In the checkout, insert the receipt text or URL to verify and place orders.",
      image: "/tb-cbe-5.png",
    },
  ]

  return (
    <div className="w-full max-w-full overflow-hidden">
      <Carousel className="w-full">
        <CarouselContent className="-ml-0">
          {steps.map((step, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="flex flex-col items-center space-y-3 p-2 w-full">
                <div className="relative w-full max-w-[240px] h-72 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <Image
                    src={`/guide/${step.image}`}
                    alt={step.title}
                    width={240}
                    height={480}
                    className="object-contain max-h-full w-auto"
                    priority={index === 0}
                  />
                </div>
                <div className="space-y-2 text-center w-full px-2">
                  <h3 className="font-semibold text-sm leading-tight">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation buttons at the bottom */}
        <div className="flex justify-center gap-3 mt-4 pb-2">
          <CarouselPrevious className="relative static transform-none" />
          <CarouselNext className="relative static transform-none" />
        </div>
      </Carousel>
    </div>
  )
}

export function CbeGuide() {
  return (
    <div className="space-y-4 text-sm">
      <ol className="space-y-4 list-decimal list-inside marker:font-semibold marker:text-primary">
        <li className="pl-2">First, open the CBE app.</li>
        <li className="pl-2">
          Insert the exact amount for your purchase.{" "}
          <span className="text-destructive font-medium">
            Inserting less or more amount will be rejected and you need to contact admin{" "}
            <a href="https://t.me/amanxhana" className="text-primary underline font-medium">
              Admin
            </a>
            .
          </span>
        </li>
        <li className="pl-2">Then, transfer the money to the designated account.</li>
        <li className="pl-2">
          Come back here, then insert your transaction receipt URL or text, and your CBE account number in the checkout form.
        </li>
        <li className="pl-2">Click verify to verify and place the order.</li>
      </ol>
      <div className="mt-6 p-4 bg-muted rounded-md border">
        <p className="text-sm font-medium mb-1">For any support, contact:</p>
        <a
          href="https://t.me/amanxhana"
          className="text-primary underline font-medium hover:text-primary/80 transition-colors"
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
      <DialogTrigger render={
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          Payment Guide
        </Button>
      } />
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Payment Guide</DialogTitle>
          <DialogDescription>
            There are 2 ways to pay: from Telebirr to CBE account (Telebirr method) or from CBE account to CBE account (CBE method). Follow the steps below to complete your payment.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="telebirr" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="telebirr">Telebirr Method</TabsTrigger>
            <TabsTrigger value="cbe">CBE Method</TabsTrigger>
          </TabsList>
          <TabsContent value="telebirr" className="mt-4 focus-visible:outline-none">
            <TelebirrGuide />
          </TabsContent>
          <TabsContent value="cbe" className="mt-4 focus-visible:outline-none">
            <CbeGuide />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}