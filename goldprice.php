<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Fetch the gold price page
$html = file_get_contents("https://www.livepriceofgold.com/saudi-arabia-gold-price.html");

// Extract 24K price using regex
preg_match('/24K Gold Rate per Gram in SAR:\s*([0-9.]+)/i', $html, $match);

if ($match && isset($match[1])) {
    echo json_encode([
        "price24" => floatval($match[1])
    ]);
} else {
    echo json_encode([
        "error" => "Unable to fetch live price"
    ]);
}
?>
