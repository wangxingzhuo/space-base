import { useRef, useState, useMemo, useEffect } from 'react';

interface ILrcLine {
    time: number; // ms
    txt: string;
}

const unit = [1, 60, 60, 24];
function transLine(txt: string): ILrcLine[] {
    const strTimes = [];
    let result = txt.match(/^\[([\d:.]+)\](.+)/);

    while (result) {
        const [_, strTime, content] = result;
        txt = content;
        strTimes.push(strTime);
        result = txt.match(/^\[([\d:.]+)\](.+)/);
    }

    return strTimes.map((item) => {
        const time = item
            .split(':')
            .reduceRight((pre, item, idx) => pre + +item * unit[idx], 0);

        return { txt, time: 1000 * time };
    });
}

export function lrcParse(txt: string) {
    return txt
        .replace(/\r/g, '\n')
        .replace(/\n\n/g, '\n')
        .split('\n')
        .reduce<ILrcLine[]>((pre, item) => {
            item = item.trim();
            if (!item) return pre;

            const lines = transLine(item);

            return !lines.length ? pre : pre.concat(lines);
        }, [])
        .sort((a, b) => {
            return a.time - b.time;
        });
}

interface ILrcProps {
    value: ILrcLine[];
    time: number; // ms
}

function findIndexByTime(list: ILrcLine[], time: number, min = -1) {
    let max = list.length - 1;
    if (max <= min) return max;

    // array is undefined or empty or less than star time
    if (!list || !list.length || time < list[0].time) return -1;

    // great than last element
    if (list[max].time <= time) return max;

    // since here, the range of value only can be a struction like [0, ..., last)

    // only 1 or 2 elements in array, it must be index 0
    if (list.length < 3) return 0;

    // when array's data like [0, 1, 2)
    if (list.length === 3) return time < list[1].time ? 0 : 1;

    if (min < 0) min = 0;
    else {
        const s = Math.sign(list[min + 1].time - time);
        if (-1 !== s) return min + +!s;
    }

    // max must be or great than 3
    // [0, 1, 2, 3, ...)

    for (let mid = max >> 1; max - min > 1; mid = (min + max) >> 1) {
        const { time: itemTime } = list[mid];
        if (itemTime === time) return mid;

        if (time < itemTime) max = mid;
        else min = mid;
    }

    return min;
}

export function LrcView(props: ILrcProps) {
    const [active, setActive] = useState(
        findIndexByTime(props.value, props.time)
    );

    useEffect(() => {
        setActive(findIndexByTime(props.value, props.time));
    }, [props.value]);

    useEffect(() => {
        setActive(findIndexByTime(props.value, props.time, active));
    }, [props.time, active]);

    return (
        <ul>
            {props.value.map((item, idx) => (
                <li
                    key={item.time}
                    className={
                        ['visited', 'active', ''][Math.sign(idx - active) + 1]
                    }
                >
                    {item.txt}
                </li>
            ))}
        </ul>
    );
}
