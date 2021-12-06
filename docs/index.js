dayjs.extend(window.dayjs_plugin_isBetween)
dayjs.extend(window.dayjs_plugin_toObject)
dayjs.extend(window.dayjs_plugin_toArray)
class DateList {
    constructor() {
        this.perDay = 1
    }
    generate() {
        let list = []
        let result = true
        let start = this.range.start
        let end = this.range.start.add(this.frequently, 'day')
        while (result) {
            for (let i = 0; i < this.perDay; i++) {
                let generated = false
                let created = null
                while (!generated) {
                    created = dayjs(this._randomDate(start, end))
                    generated = this._isEnableTime(created)
                    result = created.isBetween(this.range.start, this.range.end, 'milliseconds')
                    if (generated && result) {
                        list.push(created)
                    }
                }
            }
            start = end
            end = end.add(this.frequently, 'day')
        }
        return list.sort((a, b) => a.$d - b.$d)
    }
    _randomDate(s, e) {
        return new Date(s.valueOf() + (e.valueOf() - s.valueOf()) * Math.random())
    }
    _isEnableTime(time) {
        let result = false
        if (this.dayOfWeek.includes(time.day().toString())) {
            result = this._isTimeBetween(time, this.bedTime.start, this.bedTime.end) || this._isTimeBetween(time, this.workTime.start, this.workTime.end)
        } else {
            result = this._isTimeBetween(time, this.bedTime.start, this.bedTime.end)
        }
        return !result
    }
    _isTimeBetween(t, s, e) {
        const time = dayjs().set('hour', t.get('hour')).set('minute', t.get('minute'))
        const start = { h: s.hour(), m: s.minute() }
        const end = { h: e.hour(), m: e.minute() }

        if (start.h <= end.h) {
            return time.isBetween(s, e, 'minutes')
        } else {
            return time.isBetween(s, e.add(1, 'day'), 'minutes')
        }
    }
    _setStartEnd(s, e) {
        return {
            start: dayjs(s),
            end: dayjs(e)
        }
    }
    setRange(s, e) {
        this.range = this._setStartEnd(s, e)
    }
    setBedTime(s, e) {
        this.bedTime = this._setStartEnd(s, e)
    }
    setWorkTime(s, e) {
        this.workTime = this._setStartEnd(s, e)
    }
    setPerDay(n) {
        this.perDay = n
    }
    setFrequently(n) {
        this.frequently = n
    }
    setDayOfWeek(dw) {
        this.dayOfWeek = dw
    }
}

class CreateElement {
    constructor(list) {
        this.list = list
        this.formatList = ['String', 'JST', 'Comma', 'ISO', 'UnixTime', 'Array', 'Object']
    }
    create() {
        this._addCalendar()
        this._addDateList()
        this._addDownloadLink()
        this._addFormatSample()
    }
    _addCalendar() {
        const groupBy = this.list.reduce((result, current) => {
            const name = current.format('YYYYMMDD')
            const el = result.find(value => value.key === name)
            if(el) {
                el.count++
            } else {
                result.push({
                    key: name,
                    count: 1
                })
            }
            return result;
        }, [])
        let optView = {
            ariaDateFormat: 'Ymd',
            inline: true,
            defaultDate: this._format(this.list[0], 'ISO')
        }
        optView.onDayCreate = (dObj, dStr, fp, dayElem) => {
            groupBy.some(a => {
                if(a.key == dayElem.getAttribute('aria-label')) {
                    dayElem.innerHTML += '<div class="event" title="' + a.count + '"></div>'
                }
            })
        }
        flatpickr('#dateView', optView)
    }

    _addDateList() {
        const fragment = document.createDocumentFragment()
        const liBase = document.createElement('li')
        for (const item of this.list) {
            const li = liBase.cloneNode()
            li.innerText = item.format('YYYY-MM-DD (ddd) HH:mm:ss Z')
            li.className = 'list-item'
            fragment.appendChild(li)
        }

        const dateList = document.getElementById('dateList')
        dateList.textContent = null
        dateList.appendChild(fragment)
    }
    _addDownloadLink() {
        const fragment1 = document.createDocumentFragment()
        const fragment2 = document.createDocumentFragment()
        for (const item of this.formatList) {
            fragment1.appendChild(this._setExport(item, this._generateArray(item)))
            fragment2.appendChild(this._setExport(item, this._generateString(item)))
        }
        const downloadArray = document.getElementById('downloadArray')
        const downloadList = document.getElementById('downloadList')
        downloadArray.textContent = null
        downloadList.textContent = null
        downloadArray.appendChild(fragment1)
        downloadList.appendChild(fragment2)
    }
    _addFormatSample() {
        const fragment = document.createDocumentFragment()
        for (const item of this.formatList) {
            const td1 = document.createElement('td')
            const td2 = document.createElement('td')
            td1.innerText = item
            td2.innerText = JSON.stringify(this._format(dayjs(), item))
            const tr = document.createElement('tr')
            tr.appendChild(td1)
            tr.appendChild(td2)
            fragment.appendChild(tr)
        }
        const formatSample = document.getElementById('formatSample')
        formatSample.textContent = null
        formatSample.appendChild(fragment)
    }
    _setExport(title, data) {
        const a = document.createElement('a')
        a.href = window.URL.createObjectURL(this._generateBlob(data))
        a.innerText = title
        const span = document.createElement('sapn')
        span.appendChild(a)
        return span
    }
    _generateBlob(list) {
        return new Blob([list], { 'type' : 'text/plain' })
    }
    _generateArray(type) {
        let data = []
        for (const item of this.list) {
            data.push(this._format(item, type))
        }
        return JSON.stringify(data)
    }
    _generateString(type) {
        let data = ''
        for (const item of this.list) {
            data += this._format(item, type) + '\n'
        }
        return data
    }
    _format(item, type) {
        switch(type) {
            case 'String':
                return item.toString()
            case 'JST':
                return item.format('YYYY-MM-DDTHH:mm:ssZZ')
            case 'Comma':
                return item.format('YYYY,MM,DD,ddd,HH,mm,ss,ZZ')
            case 'ISO':
                return item.toISOString()
            case 'UnixTime':
                return item.unix()
            case 'Array':
                return item.toArray()
            case 'Object':
                return item.toObject()
            default:
                return item
        }
    }
}

const fpOptions = {
    range: {
        mode: 'range',
        enableTime: true,
        time_24hr: true,
        defaultDate: [dayjs().subtract(1, 'day').format(), dayjs().format()]
    },
    time: {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'H:i',
        time_24hr: true
    }
}
const dateRange = flatpickr('#datePick', fpOptions.range)
fpOptions.time.defaultDate = '0:00'
const startBedTime = flatpickr('#startBedTimePick', fpOptions.time)
fpOptions.time.defaultDate = '7:00'
const endBedTime = flatpickr('#endBedTimePick', fpOptions.time)
fpOptions.time.defaultDate = '7:00'
const startWorkTime = flatpickr('#startWorkTimePick', fpOptions.time)
fpOptions.time.defaultDate = '19:00'
const endWorkTime = flatpickr('#endWorkTimePick', fpOptions.time)

const setCycleInfo = () => {
    per = document.getElementById('perDay').value
    days = document.getElementById('frequently').value
    document.getElementById('actionCycleText').textContent = days + '日で約' + per + '回'
}

document.querySelectorAll('.action-cycle').forEach((target) => {
    target.addEventListener('change', () => {
        setCycleInfo()
    })
})

document.getElementById('btnGenerate').addEventListener('click', () => {
    setCycleInfo()
    const g = new DateList()
    g.setRange(dateRange.selectedDates[0], dateRange.selectedDates[1])
    g.setBedTime(startBedTime.selectedDates, endBedTime.selectedDates)
    g.setWorkTime(startWorkTime.selectedDates, endWorkTime.selectedDates)
    g.setPerDay(document.getElementById('perDay').value)
    g.setFrequently(document.getElementById('frequently').value)
    g.setDayOfWeek([...document.getElementsByName('work')].filter(el => el.checked).map(el => el.value))

    const dateList = g.generate()
    const ce = new CreateElement(dateList)
    ce.create()
})

