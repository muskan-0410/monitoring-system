$cpu = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
$memory = (Get-Counter '\Memory\% Committed Bytes In Use').CounterSamples.CookedValue
$disk = (Get-Counter '\PhysicalDisk(_Total)\% Disk Time').CounterSamples.CookedValue

$cpu = [math]::Round($cpu)
$memory = [math]::Round($memory)
$disk = [math]::Round($disk)

$result = @{
    cpu = $cpu
    memory = $memory
    disk = $disk
}

$result | ConvertTo-Json -Compress