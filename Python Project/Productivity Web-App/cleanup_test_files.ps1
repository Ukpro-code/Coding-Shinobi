# PowerShell Cleanup Script for Google Calendar Integration Testing Files
# Run this script to remove temporary testing files

Write-Host "Google Calendar Integration - Cleanup Script" -ForegroundColor Green
Write-Host "=================================================="

# List of test files to remove
$testFiles = @(
    "test_google_calendar.py",
    "test_datetime_handling.py", 
    "test_auth.py",
    "verify_oauth_setup.py",
    "QUICK_FIX_OAUTH.md"
)

Write-Host "Files to be removed:" -ForegroundColor Yellow
foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Write-Host "  [X] $file" -ForegroundColor Red
    } else {
        Write-Host "  [ ] $file (not found)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "IMPORTANT: This will permanently delete the test files!" -ForegroundColor Red
Write-Host "These files are no longer needed since Google Calendar integration is working."
Write-Host ""

# Confirm deletion
$confirm = Read-Host "Do you want to proceed with cleanup? (y/N)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host ""
    Write-Host "Removing test files..." -ForegroundColor Yellow
    
    $removedCount = 0
    foreach ($file in $testFiles) {
        if (Test-Path $file) {
            try {
                Remove-Item $file -Force
                Write-Host "  [OK] Removed: $file" -ForegroundColor Green
                $removedCount++
            } catch {
                Write-Host "  [ERROR] Failed to remove: $file" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
    Write-Host "Cleanup complete! Removed $removedCount files." -ForegroundColor Green
    Write-Host ""
    Write-Host "Core files preserved:" -ForegroundColor Green
    Write-Host "  - app.py (main application)" 
    Write-Host "  - google_calendar.py (Google Calendar service)"
    Write-Host "  - credentials.json (OAuth credentials)"
    Write-Host "  - token.json (OAuth tokens)"
    Write-Host "  - GOOGLE_CALENDAR_SETUP.md (documentation)"
    Write-Host "  - PUBLISHING_GUIDE.md (deployment guide)"
    Write-Host ""
    Write-Host "Test your app: python app.py" -ForegroundColor Cyan
    
} else {
    Write-Host ""
    Write-Host "Cleanup cancelled. No files were removed." -ForegroundColor Yellow
    Write-Host "You can run this script again anytime to cleanup test files."
}

Write-Host ""
Write-Host "See CLEANUP_GUIDE.md for more information about file cleanup."
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
