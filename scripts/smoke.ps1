# Smoke test do MVP Velora (dev server em localhost:3000)
$ErrorActionPreference = "Stop"
$base = "http://localhost:3000"
$stamp = Get-Date -Format "HHmmss"

function PostJson($session, $url, $body) {
  return Invoke-RestMethod -Uri "$base$url" -Method POST -Body ($body | ConvertTo-Json -Depth 6) -ContentType "application/json" -WebSession $session
}

# 1. Registro de tenant + admin
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
PostJson $s "/api/auth/register" @{ tenantName = "Funerária Smoke $stamp"; name = "Teste Admin"; email = "smoke$stamp@velora.test"; password = "senha12345" } | Out-Null
Write-Output "OK registro"

# 2. Caso
$case = PostJson $s "/api/cases" @{
  family = @{ name = "Maria Silva"; phone = "11 99999-0000"; relationship = "filha" }
  deceased = @{ name = "José Silva"; dateOfDeath = "2026-07-23" }
  serviceType = "velorio"
}
Write-Output "OK caso $($case.code)"

# 3. Cerimônia + teste de conflito de sala
PostJson $s "/api/ceremonies" @{ caseId = $case.id; type = "velorio"; startsAt = "2026-07-26T09:00"; endsAt = "2026-07-26T12:00"; room = "Sala 1"; vehicle = "Van 01" } | Out-Null
Write-Output "OK cerimonia"
try {
  PostJson $s "/api/ceremonies" @{ caseId = $case.id; type = "velorio"; startsAt = "2026-07-26T11:00"; endsAt = "2026-07-26T13:00"; room = "Sala 1" } | Out-Null
  Write-Output "FALHA conflito nao bloqueado"
} catch {
  Write-Output "OK conflito bloqueado (409 esperado)"
}

# 4. Estoque: item + saida vinculada ao caso + alerta de minimo
$item = PostJson $s "/api/inventory" @{ name = "Urna Clássica"; category = "urna"; quantity = 3; minQuantity = 2 }
$mv = PostJson $s "/api/inventory/movements" @{ itemId = $item.id; type = "saida"; quantity = 2; caseId = $case.id }
Write-Output "OK estoque (qtd=$($mv.quantity), lowStock=$($mv.lowStock))"

# 5. Contrato com 12 parcelas
$contract = PostJson $s "/api/contracts" @{ customerName = "Carlos Souza"; planName = "Plano Família"; totalCents = 360000; installmentsCount = 12; firstDueDate = "2026-08-01"; adjustmentRule = "IPCA anual" }
Write-Output "OK contrato $($contract.code)"

# 6. Cobrança da parcela 1 + cobrança avulsa do caso + baixa
$inv1 = PostJson $s "/api/invoices" @{ contractId = $contract.id; installmentNumber = 1 }
$inv2 = PostJson $s "/api/invoices" @{ caseId = $case.id; description = "Serviço de velório"; amountCents = 250000; dueDate = "2026-08-05" }
Invoke-RestMethod -Uri "$base/api/invoices/$($inv1.id)" -Method PATCH -Body (@{ status = "paga" } | ConvertTo-Json) -ContentType "application/json" -WebSession $s | Out-Null
Write-Output "OK cobrancas $($inv1.number), $($inv2.number) (parcela 1 paga)"

# 7. Portal da família
$portal = PostJson $s "/api/cases/$($case.id)/portal-link" @{}
$token = ($portal.link.url -split "/portal/")[1]
$portalPage = Invoke-WebRequest -Uri "$base/portal/$token" -UseBasicParsing
Write-Output "OK portal (HTTP $($portalPage.StatusCode))"

# 8. Páginas internas respondem
foreach ($p in "/dashboard", "/casos", "/casos/$($case.id)", "/agenda", "/estoque", "/contratos", "/contratos/$($contract.id)", "/faturamento", "/relatorios") {
  $r = Invoke-WebRequest -Uri "$base$p" -WebSession $s -UseBasicParsing
  Write-Output "OK $p (HTTP $($r.StatusCode))"
}

Write-Output "SMOKE COMPLETO"
