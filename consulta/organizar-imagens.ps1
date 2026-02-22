# Coloca cada imagem na pasta devida com o nome que o projeto espera
$base = "c:\Users\Rafael\Desktop\spy\consulta"
$img = "$base\images"
$av = "$img\avaliacoes"
$rel = "$img\relatorio"

# 1) images/ (raiz) - nomes exatos que o HTML usa
Copy-Item "$img\seguro_e_confiavel1.png" "$img\seguro-e-confiavel.png" -Force
Copy-Item "$img\antirastreio orderbump.png" "$img\antirastreio-orderbump.png" -Force
Copy-Item "$img\whatsappclone orderbump.png" "$img\whatsapp-orderbump.png" -Force
# Garantia: usar selo da pasta consulta se existir
if (Test-Path "$base\selo.png") { Copy-Item "$base\selo.png" "$img\garantia-90dias.png" -Force }

# 2) loading.gif (usar alerta do concluido se existir)
$concluido = "c:\Users\Rafael\Desktop\spy\concluido\images"
if (Test-Path "$concluido\alerta.gif") { Copy-Item "$concluido\alerta.gif" "$img\loading.gif" -Force }

# 3) avaliacoes/ - Carlos e Joao = homens; Marina e Ana = mulheres (foto certa por nome)
Copy-Item "$av\foto de perfil 2.jpg" "$av\carlos-perfil.jpg" -Force
Copy-Item "$av\foto perfil mulher 1.jpg" "$av\marina-perfil.jpg" -Force
Copy-Item "$av\foto de perfil 1.jpg" "$av\joao-perfil.jpg" -Force
Copy-Item "$av\foto perfil mulher 3.jpg" "$av\ana-perfil.jpg" -Force

# 4) relatorio/ - esposo-1,2,3 e esposa-1..9 e "foto recuperada 1"..5
Copy-Item "$rel\esposo-4.png" "$rel\esposo-1.png" -Force
Copy-Item "$rel\esposo-5.png" "$rel\esposo-2.png" -Force
Copy-Item "$rel\esposo-6.png" "$rel\esposo-3.png" -Force

Copy-Item "$av\foto recuperada esposa 1.jpg" "$rel\esposa-1.jpg" -Force
Copy-Item "$av\foto recuperada esposa 2.jpg" "$rel\esposa-2.jpg" -Force
Copy-Item "$av\foto recuperada esposa 3.jpg" "$rel\esposa-3.jpg" -Force
Copy-Item "$av\foto recuperada esposa 4.jpg" "$rel\esposa-4.jpg" -Force
Copy-Item "$av\foto recuperada esposa 5.jpg" "$rel\esposa-5.jpg" -Force
Copy-Item "$av\foto recuperada esposa 6.jpg" "$rel\esposa-6.jpg" -Force
Copy-Item "$av\foto perfil esposa 1.jpg" "$rel\esposa-7.jpg" -Force
Copy-Item "$av\foto perfil esposa 2.jpg" "$rel\esposa-8.jpg" -Force
Copy-Item "$av\foto perfil esposa 3.jpg" "$rel\esposa-9.jpg" -Force

# foto recuperada 1..5: ficam como foto_recuperada_1.png a 5.png (HTML sera atualizado)

Write-Host "Imagens organizadas."
