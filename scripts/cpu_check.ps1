$cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average

$result = @{
    metricType = "cpu"
    value = $cpu
}

$result | ConvertTo-Json -Compress