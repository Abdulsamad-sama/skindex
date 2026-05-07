"use client"
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';



interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
  rating: number;
  image: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ name, role, content, rating, image }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <Card className="h-full border-purple-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-full bg-linear-to-br from-purple-200 to-pink-200 overflow-hidden">
            <Image src={image} alt={name} fill sizes="56px" className="object-cover" />
          </div>
          <div>
            <CardTitle className="text-lg text-gray-800">{name}</CardTitle>
            <CardDescription className="text-purple-600">{role}</CardDescription>
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const testimonials: TestimonialCardProps[] = [
  {
    name: 'Amara Johnson',
    role: 'Content Creator',
    content: 'This facial analysis tool is incredibly accurate and inclusive. As a Black woman, I finally found a service that truly understands diverse skin tones and features. Highly recommended!',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
  },
  {
    name: 'Marcus Williams',
    role: 'Photographer',
    content: 'The technology behind this platform is impressive. It provides detailed insights while being respectful and inclusive of all ethnicities. A game-changer for my work.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  },
  {
    name: 'Zara Okafor',
    role: 'Skincare Specialist',
    content: 'Finally, a facial analysis tool that works for everyone! The accuracy for darker skin tones is exceptional. This is what true inclusivity looks like.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  },
];

const faqs = [
  {
    question: 'How does the facial analysis work?',
    answer: 'Our advanced AI technology analyzes facial features using inclusive algorithms trained on diverse datasets. We ensure accurate results for all skin tones and ethnicities.',
  },
  {
    question: 'Is my photo data secure and private?',
    answer: 'Absolutely. We use end-to-end encryption and never store your photos permanently. Your privacy is our top priority, and all data is processed securely.',
  },
  {
    question: 'Does it work for all skin tones?',
    answer: 'Yes! Our technology is specifically designed to be inclusive and accurate for all skin tones, including darker complexions. We trained our AI on diverse datasets to ensure fairness.',
  },
  {
    question: 'What kind of analysis do you provide?',
    answer: 'We provide comprehensive facial analysis including skin health assessment, feature measurements, and personalized recommendations, all delivered with respect and accuracy.',
  },
  {
    question: 'How long does the analysis take?',
    answer: 'The analysis typically takes 30-60 seconds after uploading your photo. You\'ll receive detailed results instantly on your screen.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen" >
      {/* Hero Section */}
      <section className=" min-h-screen flex grow flex-col items-center justify-center p-24 text-center">
        <h1 className="text-display font-display font-black text-primary mb-6">Welcome to Skindex</h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl mb-12">
          Precision Skin Science for every tone. Explore our clinical dashboard or run an AI-driven skin analysis.
        </p>
        <div className="flex gap-6">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:-translate-y-1 transition-transform duration-200 shadow-lg shadow-primary/20"
          >
            View Dashboard
          </Link>
          <Link
            href="/analysis"
            className="px-8 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl border border-outline-variant/30 hover:-translate-y-1 transition-transform duration-200 shadow-sm"
          >
            Start Analysis
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-display md:text-4xl">
              Loved by Our Community
            </h2>
            <p className="text-body-lg text-on-surface-variant">
              See what people are saying about our inclusive facial analysis
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-display md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-body-lg text-on-surface-variant">Everything you need to know about our service</p>
          </motion.div>

          <Accordion className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-0 rounded-2xl bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all mb-4">
                <AccordionTrigger className="px-4 py-4 text-base font-medium text-gray-800 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="rounded-xl bg-purple-50/50 p-4">
                    <span className="text-sm leading-relaxed text-gray-700">{faq.answer}</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main >
  );
}
