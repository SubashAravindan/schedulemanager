var container = document.querySelector('.container'),
   nextMonth  = document.querySelector("#nextMonth"),
   prevMonth  = document.querySelector("#prevMonth");


dispMonth=moment();  //Moment object of the month whose calendar is to be displayed

function dispCalendar() {

	document.querySelectorAll(".container .thisMonthDateBox,.container .otherMonthDateBox").forEach(node=>{
		node.remove();
	})
	document.getElementById("monthSpan").textContent=dispMonth.format("MMMM - YYYY"); 
	startIndex=dispMonth.startOf('month').weekday();
	for (var i = 0; i < 35; i++) {

		dayDiv=document.createElement("a");

		if (i>=startIndex&&i<dispMonth.daysInMonth()+startIndex) {
			var currDate=dispMonth.clone().add(i - startIndex,"days")
			dayDiv.href="/day/"+currDate.format("DDDYYYY");
			dayDiv.textContent=currDate.format("D");
			dayDiv.classList.add("thisMonthDateBox");
		}
		else{
			dayDiv.classList.add("otherMonthDateBox");
		}

		container.appendChild(dayDiv);
	}
}
dispCalendar();

nextMonth.addEventListener("click",()=>{
	dispMonth.add(1,"months");
	dispCalendar();
})

prevMonth.addEventListener("click",()=>{
	dispMonth.subtract(1,"months");
	dispCalendar();
})