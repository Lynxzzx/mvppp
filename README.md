# Veluxa — ERP para funerárias

SaaS multi-tenant que centraliza atendimento de casos, agenda de cerimônias, estoque, contratos/planos pré-pagos, faturamento e portal da família. MVP construído a partir do `PRD-Velora.md`; decisões de arquitetura em `DECISIONS.md`.

## Stack

- **Next.js 16** (App Router) + TypeScript — frontend e API no mesmo repositório (route handlers)
- **Tailwind CSS v4 + shadcn/ui** — design system próprio (modo escuro padrão + modo claro)
- **MongoDB + Mongoose** — isolamento multi-tenant por `tenantId` em todo documento e query
- **Auth própria** — JWT (jose) em cookie httpOnly, papéis: admin, atendente, financeiro
- Hospedagem alvo: Vercel + MongoDB Atlas

## Rodando localmente

```bash
npm install
copy .env.example .env.local   # ajuste MONGODB_URI e AUTH_SECRET
npm run dev
```

Acesse http://localhost:3000, clique em **Criar conta da funerária** — o primeiro usuário do tenant é o admin.

## Módulos

| Rota | Módulo (PRD) |
|---|---|
| `/casos` | Atendimento & casos (6.1) — checklist por tipo de serviço, histórico, documentos |
| `/agenda` | Agenda de cerimônias (6.2) — bloqueio automático de conflito de sala/veículo |
| `/estoque` | Estoque & fornecedores (6.3) — alerta de nível mínimo, movimentações por caso |
| `/contratos` | Contratos & planos (6.4) — cronograma automático de parcelas, reajuste, vínculo a caso |
| `/faturamento` | Faturamento (6.5) — boleto simulado, baixa manual, conciliação simples |
| `/portal/{token}` | Portal da família (6.6) — link único sem senha, expiração configurável |
| `/relatorios` | Relatórios (6.7) — casos, receita por plano/serviço, giro de estoque |

## Segurança e LGPD

- Toda query filtra por `tenantId` da sessão (helper `withAuth` em `src/lib/api.ts`)
- Trilha de auditoria (`AuditLog`) para exclusão de caso, alterações de contrato e anonimização
- Anonimização LGPD por caso (admin, em casos encerrados)

## Teste rápido

Com o servidor rodando: `powershell -ExecutionPolicy Bypass -File scripts\smoke.ps1` — exercita registro, caso, cerimônia (incl. conflito), estoque, contrato, cobranças e portal.
