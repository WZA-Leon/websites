# CSS 动画性能清单

动画看起来“顺不顺”，往往取决于浏览器是否需要反复重新布局，而不是动画代码有多复杂。

## 优先使用 transform 和 opacity

这两个属性通常可以交给合成层处理，不容易触发重排。

```css
.card {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.card:hover {
    transform: translateY(-4px);
}
```

尽量避免在动画中改变 `width`、`height`、`top`、`left` 等会触发布局的属性。

## 控制动画数量

- 首屏不要同时启动太多循环动画
- 鼠标悬浮才触发的动画，默认不要持续运行
- 页面不可见时暂停动画
- 使用 `prefers-reduced-motion` 尊重系统设置

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

## 用 will-change 要克制

`will-change` 会提前创建合成层，用多了反而增加内存压力。只给即将发生动画的少量元素使用，动画结束后移除。

## 检查清单

- [ ] 动画是否只改变 transform / opacity？
- [ ] 是否有不必要的 `box-shadow` 或 `filter` 动画？
- [ ] 移动端是否出现掉帧？
- [ ] 是否支持减少动画偏好？
- [ ] 页面切到后台后是否还在持续动画？
