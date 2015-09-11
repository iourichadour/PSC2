
call c:\frameworks\kango.version.bat

%pythonPath%python.exe %frameworkPath%kango.py build ./

php c:\frameworks\replace.php 



