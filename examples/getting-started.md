---
title: Tessel Getting Started
collapsible: true
doc_id: tessel-getting-started
---

# Tessel Getting Started

This document demonstrates every Tessel feature. Compile it with:

```bash
node tools/rollup.js --compile examples/getting-started.md --html-out examples/getting-started.html
```

---

## Template Parameters

Parameters are filled in once and substituted everywhere they appear.

@param env: Environment name
@param operator: Your name or handle

The environment is **{{env}}** and this session is owned by **{{operator}}**.

Code blocks referencing parameters get a Copy button that resolves the value before copying:

```bash
echo "Deploying to {{env}} as {{operator}}"
```

---

## Text and Area Fields

@text Server Hostname
{id=hostname, placeholder=e.g. db01.example.com, hint=Fully-qualified domain name of the target server, required=true}

@text IP Address
{id=ip_address, placeholder=192.168.1.1, validate=ip_address, warning_message=Enter a valid IPv4 address}

@area Change Description
{id=change_desc, rows=5, placeholder=Describe what this change does and why…, required=true}

---

## Date Fields

@date Change Window Start
{id=start_date, required=true, hint=When the change window opens}

@date Change Window End
{id=end_date, required_if=start_date, warning_message=End date is required when a start date is set, hint=When the change window closes}

---

## Choice Fields

@radio Environment
{id=environment}
: dev, staging, prod

@check Components Affected
{id=components}
: Database, Application, Load Balancer, DNS, Certificates

@select Change Type: Planned | Emergency | Rollback
{id=change_type}

---

## Conditional Sections

The section below only appears when **Environment** is set to `prod`.

@if environment == "prod"

## Production Checklist

> You are deploying to production. Please confirm all items before proceeding.

@check Pre-flight Checks
{id=preflight}
: Change approved by manager, Rollback plan documented, Monitoring alerts reviewed, On-call engineer notified

@credential Production Root Password
{id=prod_root_pw, hint=Retrieved from vault — stored in session only, not exported in plaintext}

@endif

@if change_type == "Emergency"

## Emergency Change Record

@area Incident Reference / Justification
{id=incident_ref, required=true, placeholder=Incident ticket number and brief description of the emergency}

@endif

---

## Credential Fields

Credential values are stored in sessionStorage only (cleared when you close the tab).
They are never written to localStorage or included in unencrypted exports.

@credential Database Password
{id=db_password, hint=Application DB user password}

@totp Database MFA Token
{id=db_totp}

---

## Table Fields

@table Affected Hosts: Hostname, Role, Confirmed
{id=host_list, required=true, warning_message=At least one host must be listed, preset_rows=db01.example.com|app01.example.com}

---

## Parse Field

Paste `ip addr show` output below to extract the primary IP:

@parse Extract IP from ip-addr: ^\s+inet\s+(\d+\.\d+\.\d+\.\d+)
{id=extracted_ip, target=ip_address, hint=Paste terminal output and click Extract, then Apply}

---

## Filename Field

@filename Export Package Name: {{env}}_change_{{change_type}}_{{STAMP}}.zip
{id=export_name, depends_on=env, change_type}

---

## Directory Field

@dir Backup Destination
{id=backup_dir, placeholder=/mnt/backups/}

---

## Notes

Use the **Session Notes** panel on the right to keep running notes during the change window. Notes are persisted in your browser and included in the export package.

Export your session when complete using the **↓ Export** button in the toolbar.
