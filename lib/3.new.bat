@echo off
set /p var=请输入要创建的组件名称:
echo "mkdir %var%"
mkdir %var%
cd %var%
grunt-init ../module-tpl
pause
