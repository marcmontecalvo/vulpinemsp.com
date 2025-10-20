# vulpinemsp.com
Public repo for the VulpineMSP.com website


© 2025 Vulpine Solutions, LLC. All rights reserved.
The Vulpine Solutions name, logo, and related branding are proprietary.
You may view this source code for reference, but reproduction of the site,
design, or content is not permitted without written consent.

# Project Summary

## Website Layout Overview

The project is organized as a static website with supporting assets, configuration, and logic for secure forms and checklists. Below is a summary of the main folders and files:

### Root Directory
- `index.html`: Main landing page of the website.
- `nginx.conf`: Nginx server configuration for deployment.
- `assets/`: Contains all static assets (CSS, JS, images).
- `pages/`: Contains all additional HTML pages, forms, and subfolders for specialized content.
- `partials/`: HTML partials for shared page sections (header, navigation, footer).
- `public/`: (Purpose not detailed; typically used for static files in some deployments.)

### assets/
- `css/`: Custom and Bootstrap CSS files for site styling.
- `images/`: Image assets for the website.
- `js/`: JavaScript files for site-wide interactivity, including form logic and Cloudflare Worker integration.

### pages/
- `faq.html`, `faq_med.html`, `faq-temp.html`: FAQ and related informational pages.
- `index_med.html`: Alternate or medical-specific landing page.
- `forms/`: Contains form-related HTML, checklists, and supporting JS.
  - `index.html`: Main entry point for forms and checklists.
  - `checklists/`: JSON files defining checklist templates and logic for various compliance and review processes.
  - `js/`: JavaScript modules for form building, export, UI, and data handling.
- `people/`: About pages for team members.
- `trust/`: Trust and policy pages (privacy, security, service level).

### partials/
- `head.html`, `footer.html`, `nav.html`, `nav_secure_forms.html`: Shared HTML partials included in main pages for consistent layout and navigation.

## Deployment Objective

The primary deployment objective is to serve a secure, static website with dynamic form and checklist functionality, leveraging Cloudflare Workers for backend operations such as form submission and email delivery. The site is designed to:

- Provide secure, user-friendly forms and checklists for compliance and review workflows.
- Use Cloudflare Workers to handle sensitive operations (e.g., form submission, email) offloaded from the static frontend.
- Be easily deployable on a static hosting platform (such as Cloudflare Pages or a server with Nginx), with Nginx handling static file serving and routing.
- Maintain modularity and reusability through the use of partials and organized asset directories.

This structure supports scalability, maintainability, and secure handling of user data, while keeping the frontend static and performant.