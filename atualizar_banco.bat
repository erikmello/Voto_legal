@echo off
setlocal
set "ROOT=%~dp0"
"%ROOT%backend\node_modules\.bin\prisma.cmd" db push --skip-generate --schema "%ROOT%backend\prisma\schema.prisma"
