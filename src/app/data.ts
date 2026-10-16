import {
  Boxes,
  Cloud,
  Code2,
  Container,
  ExternalLink,
  Github,
  Linkedin,
  MonitorCog,
  ShieldCheck,
  Workflow
} from "lucide-react";

// No email address, phone number or CV file lives in this repo. Everything here
// ships to the browser in plain HTML, so personal contact details would be
// scraped within days. Enquiries go through the contact form instead, which
// posts to a third-party endpoint that holds the destination address.
export const profile = {
  name: "Mohammed Sayed",
  shortName: "Mo",
  role: "Senior DevOps Engineer",
  company: "Osprey Flight Solutions",
  location: "London, UK",
  github: "https://github.com/Mo-ASayed",
  linkedin: "https://linkedin.com/in/mohammed-sayed-16112a179",
  medium: "https://medium.com/@Mo-ASayed",
  domain: "mohammedsayed.com",
  labDomain: "lab.mohammedsayed.com"
};

export const summary =
  "Senior DevOps Engineer with 6+ years building and operating AWS and Azure platforms across Kubernetes, Terraform, CI/CD, security and observability. Technical owner of a company-wide AWS-to-Azure migration, modernising infrastructure as code with security and cost efficiency built in. Proven track record improving delivery speed, security coverage and production reliability across cross-functional engineering teams.";

export const navItems = [
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/#work" },
  { label: "Experience", href: "/#experience" },
  { label: "Contact", href: "/#contact" }
];

export const focusAreas = [
  {
    title: "Cloud Foundations",
    copy: "Reusable AWS and Azure patterns, landing zones, delivery paths, and guardrails that make the reliable route the easy route.",
    icon: Boxes
  },
  {
    title: "Container Delivery",
    copy: "Docker, EKS, Helm, Argo CD, ingress, service routing, and production operations across distributed systems.",
    icon: Cloud
  },
  {
    title: "Secure Delivery",
    copy: "CI/CD with automated controls, image scanning, policy checks, and release practices that reduce operational surprise.",
    icon: ShieldCheck
  },
  {
    title: "Observability",
    copy: "SLO-led monitoring, actionable alerting, Grafana and Prometheus workflows, and incident response that focuses on signal.",
    icon: MonitorCog
  }
];

// Categorized skills for the CV page, matching the real CV's grouping.
export const skillGroups = [
  { category: "Containers & IaC", items: ["Docker", "Kubernetes", "Helm", "Terraform"] },
  { category: "CI/CD & GitOps", items: ["GitHub Actions", "ArgoCD", "Jenkins"] },
  { category: "AWS", items: ["EKS", "Lambda", "API Gateway", "RDS", "MWAA"] },
  { category: "Azure", items: ["Azure Functions", "Azure SQL", "Front Door", "Data Factory"] },
  { category: "Networking", items: ["DNS", "Subnets", "WAF", "Cloudflare", "Route 53"] },
  { category: "Observability", items: ["Prometheus", "Grafana", "CloudWatch", "Azure Monitor"] },
  { category: "Databases", items: ["RDS", "MSSQL", "PostgreSQL", "MySQL", "Redis"] },
  { category: "Security", items: ["SonarQube", "Trivy", "Checkov", "Azure Key Vault", "Parameter Store"] }
];

export const projects = [
  {
    title: "DockerForge",
    description:
      "A published CLI that detects a project stack, generates secure multi-stage Dockerfiles and lints existing configurations for CI.",
    href: "https://github.com/Mo-ASayed/DockerForge",
    tags: ["Node.js", "Docker", "SARIF", "npm"],
    icon: Container,
    status: "Open source product",
    scope: "Developer experience",
    proof: "Published as @dockerforge/cli · secure defaults · CI-friendly output",
    links: [
      { label: "GitHub", href: "https://github.com/Mo-ASayed/DockerForge" },
      { label: "npm", href: "https://www.npmjs.com/package/@dockerforge/cli" }
    ]
  },
  {
    title: "Order Fulfilment Platform on EKS",
    description:
      "A production-grade Amazon EKS platform running nine Go services, provisioned with Terraform and continuously delivered through ArgoCD.",
    href: "https://github.com/Mo-ASayed/eks-order-platform-v2",
    tags: ["EKS", "Terraform", "ArgoCD", "Go"],
    icon: Workflow,
    status: "Production-grade lab",
    scope: "Platform engineering",
    proof: "9 services · 3 availability zones · ~30 minute clean deployment",
    links: [{ label: "GitHub", href: "https://github.com/Mo-ASayed/eks-order-platform-v2" }]
  },
  {
    title: "AWS Threat Model App",
    description:
      "A threat-modelling application deployed to ECS Fargate through modular Terraform, with automated security controls in the delivery path.",
    href: "https://github.com/Mo-ASayed/AWS-Threat-Model-App",
    tags: ["ECS Fargate", "Terraform", "DevSecOps"],
    icon: ShieldCheck,
    status: "Cloud security project",
    scope: "DevSecOps",
    proof: "Repeatable infrastructure · container delivery · security-first design",
    links: [{ label: "GitHub", href: "https://github.com/Mo-ASayed/AWS-Threat-Model-App" }]
  },
  {
    title: "Resilient Mobile Platform Design",
    description:
      "A highly available AWS architecture for mobile authentication and application traffic, designed across two availability zones.",
    href: "https://github.com/Mo-ASayed/Architecture-Exercise",
    tags: ["AWS", "ECS", "PostgreSQL", "Cassandra"],
    icon: ExternalLink,
    status: "Architecture exercise",
    scope: "Systems design",
    proof: "Private workloads · Multi-AZ data · WAF, KMS and central observability",
    links: [{ label: "GitHub", href: "https://github.com/Mo-ASayed/Architecture-Exercise" }]
  }
];

export const experience = [
  {
    role: "Senior DevOps Engineer",
    company: "Osprey Flight Solutions",
    period: "01/2025 – present",
    tools: ["Azure", "AWS", "Terraform", "GitHub Actions", "Checkov", "Trivy"],
    points: [
      "Technical owner of a company-wide AWS-to-Azure migration: rebuilt infrastructure in modular Terraform, replatformed 4 apps and delivered 7 new applications.",
      "Cut AWS spend from £24k to £10k per month through rightsizing, log-stream cleanup and FinOps, without impacting uptime.",
      "Standardised CI/CD security scanning (Checkov, Trivy, SonarQube) across 100+ repositories, with secrets managed in Azure Key Vault.",
      "Cut CI/CD build times from 40 minutes to 10-15 minutes and reduced MTTR by 40% through hardened observability and a tested DR strategy."
    ]
  },
  {
    role: "DevOps Engineer",
    company: "Fivium",
    period: "01/2023 – 01/2025",
    tools: ["AWS", "EKS", "Terraform", "Helm", "Prometheus", "Grafana"],
    points: [
      "Managed the production Amazon EKS platform with Helm, cutting release times 25% through automated lifecycle and zero-downtime deploys.",
      "Rebuilt CI/CD on GitHub Actions, cutting deployment time from 1 hour to under 20 minutes.",
      "Codified the AWS estate in Terraform (EKS, VPC, IAM, RDS), giving teams repeatable environments and cutting setup time by 40%.",
      "Built platform observability with Prometheus, Grafana and CloudWatch, improving incident detection and response."
    ]
  },
  {
    role: "DevOps Instructor",
    company: "CoderCo",
    period: "01/2024 – 05/2026",
    tools: ["Docker", "Kubernetes", "Terraform", "GitHub Actions", "Argo CD"],
    points: [
      "Supported 1,000+ engineers building practical DevOps skills across Linux, Docker, Kubernetes, Terraform and CI/CD.",
      "Developed and led 50+ hands-on labs covering Docker, Kubernetes, Terraform, GitHub Actions, ArgoCD and Helm.",
      "Mentored junior engineers weekly, supporting practical project work and career progression."
    ]
  },
  {
    role: "DevOps Engineer",
    company: "eGain Corporation",
    period: "02/2020 – 12/2022",
    tools: ["AWS", "EKS", "Docker", "Jenkins", "Python", "Postman"],
    points: [
      "Built and ran containerised environments on Docker and Amazon EKS, delivering reliable app and API releases.",
      "Automated build, test and release pipelines with Jenkins, Python and Bash, removing manual effort.",
      "Added Postman API testing and automated reporting, giving stakeholders continuous visibility of release quality."
    ]
  }
];

export const cvProjects = [
  "Cloud-Native E-Commerce Platform on Amazon EKS: 9 microservices, GitOps, stateful Kubernetes, full observability.",
  "Scalable Kanban Deployment: Terraform & CI/CD on EKS.",
  "Automated “Threat Model” app: modular Terraform, GitHub Actions, AWS ECS (Fargate).",
  "Multi-Application Deployment with ArgoCD & Kubernetes: RBAC, TLS, custom Ingress.",
  "Kubernetes CI/CD Pipeline with Real-Time Monitoring: GitHub Actions, Docker, EKS, Prometheus/Grafana."
];

export const education = [
  {
    degree: "Aerospace Engineering",
    institution: "Brunel University"
  }
];

export const links = [
  { label: "GitHub", href: profile.github, icon: Github },
  { label: "LinkedIn", href: profile.linkedin, icon: Linkedin },
  { label: "Tech blog", href: profile.medium, icon: Code2 }
];
