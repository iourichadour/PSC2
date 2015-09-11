
var QSelects, QInserts, QUpdates, QDeletes, QTruncates;

function sqlRecombine_replacechar(match){

	/**	Search for SQL Statement	**/
	/**	Find all bind Characters	**/
	/**	Replace all Binds			**/
	
	/**	Output the SQL Statement with Bind Vars	**/
	var sqlMatchString = /Stmt=(.*?)\n/gi
	var bindMatchString = /Bind-\d+.*value=(.*?)\n/gi
	
	var SQL 	= match.match( sqlMatchString );
	var Binds 	= match.match( bindMatchString );
	
	/**	Replace Binds	**/
	if( Binds )
	{
		for( i = Binds.length; i > 0; i-- )
		{
			thisValue = Binds[i-1].match( /Bind-\d+.*value=(.*?)\n/m );
			newValue ="'" + thisValue[1] + "'";
			SQL = SQL.toString().replace( ":"+i, newValue );
		}
	}
	/**	Return SQL String	**/
    SQL = SQL.toString().replace( "Stmt=", "" );

    if(    !QSelects.prop('checked') 
        && !QInserts.prop('checked') 
        && !QUpdates.prop('checked') 
        && !QDeletes.prop('checked') 
        && !QTruncates.prop('checked') )
        {
        } else {
            if( !QSelects.prop('checked') && SQL.substring(0,3).toLowerCase() == 'sel' )
                return "";
            if( !QInserts.prop('checked') && SQL.substring(0,3).toLowerCase() == 'ins' )
                return "";
            if( !QUpdates.prop('checked') && SQL.substring(0,3).toLowerCase() == 'upd' )
                return "";
            if( !QDeletes.prop('checked') && SQL.substring(0,3).toLowerCase() == 'del' )
                return "";
            if( !QTruncates.prop('checked') && SQL.substring(0,3).toLowerCase() == 'tru' )
                return "";
    }
    SQL = SQL.replace("\n", ";\n" );
	document.getElementById( "myTrace" ).innerHTML += SQL;
    return "";
}

function runTrace()
{
    
    QSelects = $('#trace_selects');
    QInserts = $('#trace_inserts');
    QUpdates = $('#trace_updates');
    QDeletes = $('#trace_deletes');
    QTruncates = $('#trace_truncates');
    
	document.getElementById( 'myTrace' ).innerHTML = "";
	var sqlRecombine;
    sqlRecombine    = /.*Stmt=(.*?)\n(.*Bind.*\n)+/gim;
	sqlRecombine = /.*Stmt=(.*?)\n(.*[COM|Commit].*)/gim;
	sqlRecombine = /.*Stmt=(.*?)\n(.*Bind.*\n)*|^COM\s|^Commit]]/gim;
    document.getElementById('myTrace').style.visibility = 'block';
	document.getElementById('traceLogManual').value.replace( sqlRecombine, function(m){ return sqlRecombine_replacechar(m)} );
	if( document.getElementById( 'myTrace' ).innerHTML == '' )
        document.getElementById( 'myTrace' ).innerHTML = 'Processing resulted in no SQL queries';
    document.getElementById( 'myTrace' ).innerHTML += "\n";
        
        
}


function readFileViaApplet(n) {

	document.getElementById( 'myTrace' ).innerHTML = "Reading File...";
    try{
        readFileHttp( theLocation, runTrace );
    }catch(e){document.getElementById( 'myTrace' ).innerHTML = e.toString();}

	
	
}




function readFileHttp(fname, callback) {
   xmlhttp = getXmlHttp();
   xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState==4) { 
          callback(xmlhttp.responseText); 
      }
   }
   xmlhttp.open("GET", fname, true);
   xmlhttp.send(null);
}

/*
Return a cross-browser xmlhttp request object
*/
function getXmlHttp() {
   if (window.XMLHttpRequest) {
      xmlhttp=new XMLHttpRequest();
   } else if (window.ActiveXObject) {
      xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
   }
   if (xmlhttp == null) {
      alert("Your browser does not support XMLHTTP.");
   }
   return xmlhttp;
}


