<?php

// ===== Debug local / log de erro =====
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ===== LOG FUNCTION =====
function log_message($message) {
    $log = "[" . date("Y-m-d H:i:s") . "] " . $message . PHP_EOL;
    file_put_contents(__DIR__ . '/logs.txt', $log, FILE_APPEND);
}

// ===== CORS: Liberar temporariamente =====
$allowedOrigins = ['https://espiaoculto.com', 'https://espiao-zap.com.br'];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
} else {
    header('Access-Control-Allow-Origin: *'); // Para testes (remova em produção)
}

// ===== HEADERS =====
header('Content-Type: application/json');

// ===== Método permitido =====
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Apenas requisições POST são aceitas.']);
    log_message("Requisição negada: Método inválido.");
    exit;
}

// ===== Leitura segura do JSON =====
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if (!isset($input['phone'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Campo \"phone\" é obrigatório.']);
    log_message("Erro: Campo 'phone' ausente.");
    exit;
}

// ===== Sanitização do número =====
$phone = preg_replace('/[^0-9]/', '', $input['phone']);

if (strlen($phone) < 10) {
    http_response_code(400);
    echo json_encode(['error' => 'Número de telefone inválido.']);
    log_message("Erro: Número inválido recebido: $phone");
    exit;
}

log_message("Requisição iniciada para telefone: $phone");

// ===== Requisição à API externa =====
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "https://whatsapp-data1.p.rapidapi.com/number/$phone",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "GET",
    CURLOPT_HTTPHEADER => [
        "x-rapidapi-host: whatsapp-data1.p.rapidapi.com",
        "x-rapidapi-key: 4f9decdf1cmsha8e3c875cf114cfp10297fjsnf1451941f64f"
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

// ===== Verificação final =====
if ($err) {
    http_response_code(500);
    echo json_encode(['error' => "Erro cURL: $err"]);
    log_message("Erro na API: $err");
} else {
    log_message("Sucesso. Resposta completa:\n" . $response);

    echo $response;
}
?>
