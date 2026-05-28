!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "OroPrinter"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "oroprinter"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "OroPrinter"
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "oroprinter"
!macroend
