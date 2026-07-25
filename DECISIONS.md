# DECISIONS.md — Veluxa

Registro de suposições e decisões de arquitetura tomadas durante a implementação do MVP.
Formato: decisão + uma frase de justificativa. Itens marcados com **[PRD em aberto]** correspondem às questões em aberto da seção 11 do PRD.

## Questões em aberto do PRD (seção 11)

- **[PRD em aberto] Gateway de pagamento**: para o faturamento operacional (cobranças de casos/contratos), o MVP mantém "boleto simulado" com baixa manual, conforme PRD 6.5; a camada `Invoice` tem `gateway`/`externalId` reservados. Para a **assinatura do próprio SaaS**, foi integrada a **MisticPay** (PIX): Essencial R$ 297/mês, Profissional R$ 697/mês, Rede sob consulta via WhatsApp (55999475210). O webhook da MisticPay não é assinado, então o servidor **sempre reconsulta** `/transactions/check` antes de ativar o plano (nunca confia no corpo do webhook). Ativação = 30 dias de `planPaidUntil` no Tenant; renovação é manual no MVP (sem cobrança recorrente automática).
- **Painel da plataforma (`/sysadmin`)**: acesso separado das funerárias, cookie `veluxa_platform`, credenciais via `PLATFORM_ADMIN_USER` / `PLATFORM_ADMIN_PASSWORD` (padrão Lynx / veluxa2026). Permite listar funerárias e usuários, alterar planos/`planPaidUntil`, suspender contas, resetar senhas e ver pagamentos MisticPay.
- **[PRD em aberto] Multiunidade (plano Rede)**: modelo escolhido = **um tenant por funerária/rede, com unidades embutidas no documento Tenant** (`tenant.units[]`) e `unitId` opcional em User/Case/Ceremony. É a opção mais simples que não bloqueia a fase 2: relatórios consolidados ficam triviais (mesmo tenantId) e o isolamento de segurança continua sendo por tenant.
- **[PRD em aberto] Emissão fiscal**: fora do MVP, conforme PRD 5.2. O faturamento registra cobranças internamente; `Invoice` tem campo `fiscalStatus: "nao_emitida"` reservado para integração futura com parceiro contábil.

## Stack e infraestrutura

- **Backend = API Routes do Next.js (route handlers)**, sem serviço separado: um único repositório/deploy na Vercel é mais simples de manter para um MVP; se o domínio financeiro crescer, extrai-se um serviço depois.
- **Autenticação própria com JWT (jose) em cookie httpOnly + bcryptjs**, em vez de NextAuth: o modelo (credenciais + tenant + papel) é simples e o controle total sobre o payload da sessão (tenantId, role) evita adaptações no NextAuth.
- **Sessão carrega `tenantId` e `role`**; todo route handler passa pelo wrapper `withAuth`, que injeta a sessão e nunca aceita tenantId vindo do cliente.
- **MongoDB + Mongoose**, alvo MongoDB Atlas. Conexão cacheada em global para sobreviver a hot-reload/lambdas (`src/lib/db.ts`).
- **Next.js 16 (App Router)**: o create-next-app atual gera Next 16; atende ao requisito "Next.js 14+".
- Stack alternativa considerada: nenhuma mudança sugerida — a stack pedida (Next + Mongo/Mongoose + Tailwind/shadcn) é adequada para este produto e para a hospedagem Vercel + Atlas.

## Modelagem (coleção própria vs. subdocumento)

- **Tenant**: coleção própria; `units[]` e `subscriptionPlan` embutidos (lidos sempre junto do tenant).
- **User**: coleção própria (login e índice único por e-mail global).
- **Case**: coleção própria; `family` (responsável), `deceased` (falecido), `checklist[]`, `timeline[]` (histórico de interações) e `documents[]` (metadados + conteúdo base64) embutidos, pois são sempre lidos/escritos junto do caso e não são consultados isoladamente.
- **Ceremony**: coleção própria (consultada por intervalo de datas na agenda, independente do caso).
- **InventoryItem** e **Supplier**: coleções próprias; movimentações de estoque em coleção própria `StockMovement` (crescimento ilimitado + consulta por caso e por período).
- **Contract**: coleção própria com **`installments[]` embutido** — parcelas são sempre lidas/escritas junto do contrato pai e o total por contrato é pequeno (dezenas), longe do limite de 16MB.
- **Invoice**: coleção própria (conciliação e listagem financeira são consultas independentes do caso/contrato).
- **FamilyPortalLink**: coleção própria com token único indexado — é o ponto de entrada público, consultado sem contexto de tenant.
- **AuditLog**: coleção própria, append-only, para trilha de auditoria de ações críticas (exclusão de caso, alteração de contrato, etc.).

## Multi-tenant e segurança

- Todo documento operacional carrega `tenantId` (ObjectId) e **todas as queries filtram por `tenantId` da sessão** — regra imposta pelos helpers de API; nenhum handler consulta coleção operacional sem esse filtro.
- Índices compostos com `tenantId` como prefixo criados desde o início (ex.: `{tenantId, status}`, `{tenantId, startsAt}`, `{tenantId, category}`).
- Papéis: `admin` (tudo), `atendente` (casos, agenda, estoque), `financeiro` (contratos, faturamento, relatórios). Autorização checada no backend por rota, não só na UI.
- **LGPD**: dados pessoais de família/falecido ficam agrupados nos subdocumentos `family` e `deceased` do Case; existe ação de **anonimização** (admin) que substitui os campos pessoais por marcadores e registra em auditoria — estrutura pronta para atender exclusão mediante solicitação.

## Produto / UX

- Modo escuro é o padrão (tokens da marca); modo claro equivalente disponível no topbar (persistido via next-themes).
- Rotas internas em português (`/casos`, `/agenda`, `/estoque`, `/contratos`, `/faturamento`, `/relatorios`); API em inglês (`/api/cases`, ...), espelhando os nomes de entidades do PRD seção 9.
- Documentos de caso: armazenados como base64 dentro do documento do caso, com limite de 2MB por arquivo — evita dependência de S3/Blob no MVP; trocar por storage externo quando houver volume (registrado como dívida técnica consciente).
- Checklist por tipo de serviço: templates padrão embutidos no código (velório, sepultamento, cremação) aplicados na criação do caso; "configurável por tipo de serviço" no MVP = editável por caso, com template inicial por tipo. Configuração por tenant fica para depois.
- Portal da família: expiração padrão de 30 dias após encerramento do caso, configurável ao gerar o link (PRD 6.6).
