# Render the same monochrome AJ monogram used in the navigation at PWA icon sizes.
Add-Type -AssemblyName System.Drawing
$iconDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public/icons'))
foreach ($size in @(72,96,128,144,152,192,384,512)) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0f1014'))
    $font = [System.Drawing.Font]::new('Arial', ($size * 0.47), ([System.Drawing.FontStyle]::Bold -bor [System.Drawing.FontStyle]::Italic), [System.Drawing.GraphicsUnit]::Pixel)
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $bounds = [System.Drawing.RectangleF]::new(0, (-0.025 * $size), $size, $size)
    $graphics.DrawString('aj', $font, [System.Drawing.Brushes]::White, $bounds, $format)
    $bitmap.Save((Join-Path $iconDirectory "icon-${size}x${size}.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $format.Dispose()
    $font.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}
Write-Output 'Rendered eight square PWA icons with a maskable safe margin.'
