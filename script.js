// ${{ secrets.API_KEY }}

(async function(){

    const API_KEY = '765648099e70445997372521232510'
    const DEFAULT_LOC = 'london'
    
    let location
    let currentInterval
    currentInterval = await loadContents()
    console.log(currentInterval)


    const userInput = document.querySelector('input')
    userInput.addEventListener('input',(e) => renderSuggestions(e))

    const form = document.querySelector('form')
    form.addEventListener('submit',async (e)=>{
        e.preventDefault()
        console.log(currentInterval)
        clearInterval(currentInterval)
        currentInterval = await loadContents()
        console.log(currentInterval)
    })

    async function renderSuggestions(e) {
        if (e.target.value) {
            const inputVal = e.target.value
            const datalist = document.querySelector('#suggestions')
            datalist.innerHTML = ''
            const endpoint = `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${inputVal}`
            try {
                const response = await fetch(endpoint)
                const suggestions = await response.json()
                if (suggestions.length > 0) {
                    if (suggestions[0].name != inputVal) {
                        for (const suggestion of suggestions) {
                            const elem = document.createElement('option')
                            elem.value = suggestion.name
                            elem.innerHTML = suggestion.name
                            datalist.append(elem)
                        }
                    }
                }

            } catch(error) {
                window.alert(error)
            }
        }
    }

    async function getWeather() {
        const inputElem = document.querySelector('input')

        inputElem.blur();

        const inputLoc = inputElem.value
        let endpoint
        if (inputLoc) {
            endpoint = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${inputLoc}&days=7`
        } else {
            endpoint = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${DEFAULT_LOC}&days=7`
        }
        try {
            const response = await fetch(endpoint,{mode: 'cors'})
            if (response.ok) {
                const data = await response.json()
                inputElem.value = ''
                return data
            } else {
                throw new Error('Invalid search query')
            }
        } catch(error) {
            // inputElem.setCustomValidity(error)
            return error
        }
    }

    async function loadContents() {
        const containerElem = document.querySelector('.container')
        containerElem.style.opacity = 0;
        try {
            const data = await getWeather()
            if (data instanceof Error) {
                throw Error(data.message)
            }
            location = data.location
            const today = data.current
            const forecast = data.forecast
            
            loadTime(location)

            Promise.all([
                loadToday(today),
                loadForecast(forecast.forecastday),
                loadWallpaper(today.condition.code)
            ])

            containerElem.style.opacity = 1;
        } catch(error) {
            window.alert(error)
        }

        containerElem.style.opacity = 1;
        console.log(location)
        return setInterval(()=>{
            loadTime(location)
        },1000)

        
        
    }

    function loadToday(today) {
        const todayElem = document.querySelector('.today')
        const todayTempElem = todayElem.querySelector('.today-temp')
        const todayWeatherElem = todayElem.querySelector('.today-weather')
        const todayFeelslikeElem = todayElem.querySelector('.today-feelslike')

        todayTempElem.innerHTML = `${today.temp_c}°`
        todayWeatherElem.innerHTML = today.condition.text
        todayFeelslikeElem.innerHTML = `Feels like ${today.feelslike_c}°`
    }

    function loadForecast(forecast) {
        const forecastElem = document.querySelector('.forecast')
        const forecastArr = [...forecastElem.children]
        forecastArr.forEach((element,index) => {
            dateElem = element.querySelector('.date')        
            iconElem = element.querySelector('.icon')        
            tempElem = element.querySelector('.temp')        
            weatherElem = element.querySelector('.weather')        
            
            const dataObj = forecast[index+1]
            const rawDate = new Date(dataObj.date)
            
            dateElem.innerHTML = formatDate(rawDate)
            iconElem.src = dataObj.day.condition.icon
            tempElem.innerHTML = `${Math.round(dataObj.day.maxtemp_c)}°/${Math.round(dataObj.day.mintemp_c)}°`
            weatherElem.innerHTML = dataObj.day.condition.text
        });
    }

    function formatDate(dateObj) {
        const weekday = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
        const date = dateObj.getDate()
        const month = dateObj.getMonth()
        const day = weekday[dateObj.getDay()]
        return `${day} ${date}/${month}`
    }

    function loadTime(location) {
        // console.log(location)
        const timezone = location.tz_id
        const now = new Date()
        const timeStr = now.toLocaleTimeString('en', { timeZone: timezone })
        const timeElem = document.querySelector('.time')
        const locationElem = document.querySelector('.location')
        timeElem.innerHTML = timeStr.slice(0,-6)+ timeStr.slice(-2)
        locationElem.innerHTML = location.name
    }

    async function getImgPath(weatherCode) {
        const time = document.querySelector('.time').innerHTML
        const hour = (parseInt(time.slice(0,-5)) == 12 ? 0 : parseInt(time.slice(0,-5)))+ (time.slice(-2) == 'PM' ? 12 : 0)
        const weatherJSON = await fetch('./weather.json')
        const weatherArr = await weatherJSON.json()
        const weatherObj = weatherArr.find(
            (obj)=>{
                return obj.code == weatherCode
            }
        )
        // console.log(weatherObj,hour)
        if (6 < hour && hour < 19) {
            return weatherObj.day
        } else {
            return weatherObj.night
        }
    }

    async function loadWallpaper(weatherCode){
        const bodyElem = document.querySelector('body')
        const imgPath = await getImgPath(weatherCode)
        bodyElem.style.backgroundImage = `url('${imgPath}')`
    }

})()