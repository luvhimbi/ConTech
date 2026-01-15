# ConTech Client, Quotation, Invoice Manager

A React + TypeScript + Vite web app for small to medium construction and service businesses to manage clients (CRM-lite), projects, quotations, invoices, and client history. The app uses Firebase Authentication and Cloud Firestore as the backend.

## Table of Contents

- Overview
- Features
- Tech Stack
- Project Structure
- Prerequisites
- Firebase Setup
    - Create Firebase Project
    - Enable Authentication
    - Create Firestore Database
    - Add Web App and Get Config
- Environment Variables
- Firestore Data Model
    - Users
    - Clients
    - Projects
    - Quotations
    - Invoices
- Firestore Security Rules
- Local Development
- Build and Deploy
    - Build
    - Deploy to Netlify
- Common Issues and Fixes
    - Firestore Permission Denied
    - Unsupported field value: undefined
    - Collection group query requires index
    - Client history not showing
- Scripts
- Contributing
- License

## Overview

ConTech is a lightweight business management tool designed to help contractors and small businesses keep track of:

- Clients and notes
- Projects
- Quotations and invoices per project
- Client history (all quotations and invoices associated with a client)

The frontend is built with React + TypeScript, bundled with Vite. Data is stored in Firestore and protected by Firestore Security Rules. Authentication is handled via Firebase Authentication.

## Features

### Client Management (CRM-lite)

- Client directory
- Client profile page
- Tags (VIP, slow payer, urgent)
- Notes (site access rules, preferred contact)
- Client history (all quotations and invoices linked to the client email)

### Projects

- Create and manage projects
- Each project holds its own quotations and invoices subcollections

### Quotations

- Create, update, delete quotations
- Store client details on quotations
- Status tracking (draft, sent, accepted, rejected)

### Invoices

- Create, update, delete invoices
- Store client details on invoices
- Billing details (business info and payment details)
- Deposit configuration (optional)
- Milestones (optional)
- Status tracking (pending, paid, cancelled)
- PDF generation

### Client History (Cross-Project)

- Displays all invoices and quotations across all projects for a specific client
- Implemented using Firestore `collectionGroup` queries
- Recommended to store `clientEmailLower` for consistent matching

## Tech Stack

- React
- TypeScript
- Vite
- Firebase Authentication
- Cloud Firestore
- jsPDF + jspdf-autotable (PDF generation)

## Project Structure

