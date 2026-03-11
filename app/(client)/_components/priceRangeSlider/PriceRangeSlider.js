"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Định dạng số thành tiền tệ Việt Nam
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value) + ' đ';

export default function PriceRangeSlider({ min, max, step, initialMin, initialMax, onApply }) {
    const [minVal, setMinVal] = useState(initialMin);
    const [maxVal, setMaxVal] = useState(initialMax);
    const minValRef = useRef(null);
    const maxValRef = useRef(null);
    const range = useRef(null);

    // Chuyển đổi giá trị sang phần trăm để định vị
    const getPercent = useCallback((value) => Math.round(((value - min) / (max - min)) * 100), [min, max]);

    // Cập nhật thanh màu xanh ở giữa 2 nút
    useEffect(() => {
        if (maxValRef.current) {
            const minPercent = getPercent(minVal);
            const maxPercent = getPercent(maxValRef.current.value);

            if (range.current) {
                range.current.style.left = `${minPercent}%`;
                range.current.style.width = `${maxPercent - minPercent}%`;
            }
        }
    }, [minVal, getPercent]);

    useEffect(() => {
        if (minValRef.current) {
            const minPercent = getPercent(minValRef.current.value);
            const maxPercent = getPercent(maxVal);

            if (range.current) {
                range.current.style.width = `${maxPercent - minPercent}%`;
            }
        }
    }, [maxVal, getPercent]);

    // Reset state khi initial values thay đổi
    useEffect(() => {
        setMinVal(initialMin);
        setMaxVal(initialMax);
    }, [initialMin, initialMax]);

    return (
        <div className="bg-white rounded-2xl shadow border border-gray-100 mt-6">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-dollar-sign" />
                    </div>
                    <h2 className="font-semibold text-gray-900">Lọc theo giá</h2>
                </div>
                <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => onApply([min, max])}
                >
                    Reset
                </button>
            </div>

            <div className="p-6">
                {/* Phần slider */}
                <div className="relative h-8 flex items-center">
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={minVal}
                        ref={minValRef}
                        onChange={(event) => {
                            const value = Math.min(Number(event.target.value), maxVal - step);
                            setMinVal(value);
                        }}
                        className="absolute w-full h-1 z-10"
                    />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={maxVal}
                        ref={maxValRef}
                        onChange={(event) => {
                            const value = Math.max(Number(event.target.value), minVal + step);
                            setMaxVal(value);
                        }}
                        className="absolute w-full h-1 z-20"
                    />

                    {/* Lớp nền và thanh tiến trình */}
                    <div className="relative w-full">
                        <div className="absolute rounded-md bg-gray-200 h-1 w-full z-0" />
                        <div ref={range} className="absolute rounded-md bg-blue-600 h-1 z-0" />
                    </div>
                </div>

                {/* Hiển thị giá trị */}
                <div className="flex justify-between items-center text-sm text-gray-700 mt-4">
                    <span>{formatCurrency(minVal)}</span>
                    <span>{formatCurrency(maxVal)}</span>
                </div>

                {/* Nút áp dụng */}
                <button
                    onClick={() => onApply([minVal, maxVal])}
                    className="mt-6 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Áp dụng
                </button>
            </div>
        </div>
    );
}