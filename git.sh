git add .
echo -n "what is this change for( command Line: bash gitscript.sh) ?"
read;
git commit -m "${REPLY}"
git push