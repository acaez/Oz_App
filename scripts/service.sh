#!/bin/zsh
# Service macOS (launchd) : l'app démarre à l'ouverture de session,
# redémarre si elle plante, et se recharge quand backend/ ou frontend/ change.
#
#   ./scripts/service.sh install    installe + démarre
#   ./scripts/service.sh restart
#   ./scripts/service.sh stop       (jusqu'au prochain login)
#   ./scripts/service.sh uninstall
#   ./scripts/service.sh logs
#   ./scripts/service.sh status

set -e
LABEL=com.oz.app
ROOT=${0:A:h:h}
PLIST=~/Library/LaunchAgents/$LABEL.plist
NODE=$(command -v node)
DOMAIN=gui/$(id -u)

case "$1" in
  install)
    mkdir -p "$ROOT/logs" ~/Library/LaunchAgents
    cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>             <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>--watch-path=.</string>
    <string>--watch-path=../frontend</string>
    <string>server.js</string>
  </array>
  <key>WorkingDirectory</key>  <string>$ROOT/backend</string>
  <key>RunAtLoad</key>         <true/>
  <key>KeepAlive</key>         <true/>
  <key>ThrottleInterval</key>  <integer>5</integer>
  <key>StandardOutPath</key>   <string>$ROOT/logs/app.log</string>
  <key>StandardErrorPath</key> <string>$ROOT/logs/app.log</string>
</dict>
</plist>
PLIST
    launchctl bootout $DOMAIN/$LABEL 2>/dev/null || true
    launchctl bootstrap $DOMAIN "$PLIST"
    echo "OK → http://localhost:3000" ;;
  restart)   launchctl kickstart -k $DOMAIN/$LABEL ;;
  stop)      launchctl bootout $DOMAIN/$LABEL ;;
  uninstall) launchctl bootout $DOMAIN/$LABEL 2>/dev/null || true; rm -f "$PLIST"; echo "Service supprimé" ;;
  logs)      tail -n 50 -f "$ROOT/logs/app.log" ;;
  status)    launchctl print $DOMAIN/$LABEL | grep -E "state|pid|last exit" ;;
  *)         echo "Usage: $0 {install|restart|stop|uninstall|logs|status}"; exit 1 ;;
esac
