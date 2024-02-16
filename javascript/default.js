---
layout: blank
---
//Version {{ site.version_number }}
//{{ site.urllive }}

var linkProjectsDynamic = [ {% assign sorted_pages = site.pages | sort:"url" %}{% for p in sorted_pages %}{%- if p.title -%}{Name:'{{ p.title }}',URL:'{{ p.url }}'},{%- endif -%}{% endfor %} ];

var testpostsJSON = "{% assign sorted_posts = site.posts | sort:"url" %}{% for x in sorted_posts %}{%- if x.title -%}{{ x.url }}:'{{ x.title }}',{%- endif -%}{% endfor %}";


const _maxDaysForSubmission = 1000*60*60*24*365;
function forceLeagueRefresh(){
	setLocal("LeagueTable", "01-01-2000");	
	setLocal("ResultsTable", "01-01-2000");
	arrAdjust(z);
}

function timestampToDateObj(str){
	var datearr = str.split(" ")[0].split("/");
	var timearr = str.split(" ")[1].split(":");
	return new Date(datearr[2],datearr[1]-1,datearr[0],timearr[0],timearr[1],timearr[2]);
}
function buildResultTable(arr){
	return Object.values(arr.reduce((acc, obj) => {
		if(obj["Comment"] == "Game Removed"){return acc;}
		obj["Home Score"] = +obj["Home Score"] || 0; // convert to number
		obj["Away Score"] = +obj["Away Score"] || 0; // convert to number
		const keyHome = obj["League Year"] + '_' + obj["League Type"] + '_' + obj["Home Team"]; // unique combination of ids
		const key2 = obj["League Year"] + '_' + obj["League Type"] + '_' + obj["Away Team"]; // unique combination of ids
		acc[keyHome] = acc[keyHome] || {"League Year":obj["League Year"],"League Type":obj["League Type"],"Team":obj["Home Team"],"Games":0,"Forfeit":0,"Won":0,"Lost":0,"Points For":0,"Points Against":0,"Point Difference":0,"League Points":0};
		acc[key2] = acc[key2] || {"League Year":obj["League Year"],"League Type":obj["League Type"],"Team":obj["Away Team"],"Games":0,"Forfeit":0,"Won":0,"Lost":0,"Points For":0,"Points Against":0,"Point Difference":0,"League Points":0};
		if(obj["Comment"] == "Home Forfeit"){
			acc[keyHome]["Forfeit"]++;
			acc[keyHome]["League Points"]--;
			obj["Away Score"] = 20;
		}else if(obj["Comment"] == "Away Forfeit"){		
			acc[key2]["Forfeit"]++;
			acc[key2]["League Points"]--;
			obj["Home Score"] = 20;
		}	  
		if(obj["Home Score"] > obj["Away Score"]){
			acc[keyHome]["League Points"]+=3;
			acc[keyHome]["Won"]++;
			acc[key2]["League Points"]++;
			acc[key2]["Lost"]++;
		} else if(obj["Home Score"] < obj["Away Score"]) {
			acc[key2]["League Points"]+=3;
			acc[key2]["Won"]++;
			acc[keyHome]["League Points"]++;
			acc[keyHome]["Lost"]++;
		}
		acc[keyHome]["Games"]++;
		acc[keyHome]["Points For"]+=obj["Home Score"];
		acc[keyHome]["Points Against"]+=obj["Away Score"];
		acc[keyHome]["Point Difference"]+=( obj["Home Score"] - obj["Away Score"] );
		acc[key2]["Games"]++;
		acc[key2]["Points For"]+=obj["Away Score"];
		acc[key2]["Points Against"]+=obj["Home Score"];
		acc[key2]["Point Difference"]+=( - obj["Home Score"] + obj["Away Score"] );
		return acc;
	}, {}));
}
//Timestamp	League Year	League Type	Match Number	Home Score	Away Score	MVP	Comments/Additional Details	Match Sheet Photo	Home Team	Away Team	Referee 1	Referee 2	Date	Comment
var _joinTable = null;

async function getResultTable(){
    return getLeagueTable(true)
}
async function getLeagueTable(resultTable = false){
	var _resultsTable = null;
	_joinTable = await fetchData("https://docs.google.com/spreadsheets/d/e/2PACX-1vSk1zlmJL1U2RRx0hFU9-VLRHSrjpcvU2ViiwcUPnOQiAsrrdlDPajgnMzYuxiQ3zZH583YdziamKtk/pub?gid=0&single=true&output=csv", "OBJECT", "LeagueTable", (60*60*24*7));
	if (_joinTable != null) {
		if (resultTable){return buildResultTable(_joinTable);}
		_joinTable.forEach(function(item, index) {
			var MatchDate = new Date(item.Date).getTime();
			var dateNow = new Date(UTCString(true)).getTime();
			if (item["Timestamp"] !== undefined){
				var SubmitTime = timestampToDateObj(item["Timestamp"]).getTime();
				if ((MatchDate + _maxDaysForSubmission) < SubmitTime){
					item["Comment"] = "Submit Late";
				}
				if (item["Home Score"] > item["Away Score"]){
					item.Winner = item["Home Team"];
				} else if(item["Home Score"] < item["Away Score"]){
					item.Winner = item["Away Team"];			
				} else {
					item.Winner = "Draw";
				}
			} else{
				item["Comment"] = "To Play";
				item["Submit Result"] = "https://docs.google.com/forms/d/e/1FAIpQLSe_zCLLs9ADsMD2oUFQ76WKY2ZMayX_5tVO2M4h4FNhK1RhLA/viewform?usp=pp_url&entry.821820740=" + item['League Year'] + "&entry.492201271=" + item['League Type'].replace(' ', '+') + "&entry.1142329140=" + item['Match Number'];
			}
			if (item["Timestamp"] === undefined && ((MatchDate + _maxDaysForSubmission) < dateNow)){
				item.Winner = "Late To Submit";
			}
			if(item["Comment"] == "Game Removed"){item.Winner = "Removed";}
			delete item["Timestamp"];
			//delete item["Game Status"];
			
		});
		return (_joinTable)
	} else {
		getElem('tbl').insertAdjacentHTML("beforebegin", "Error Download Failed");
	}
}