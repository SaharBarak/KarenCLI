# Karen's Layout Audit Report

**Site:** https://karencli.vercel.app  
**Date:** 11/21/2025, 9:19:13 PM  
**Total Issues:** 72 (0 critical, 71 high, 1 medium, 0 low)

---

## ⚠️ High Priority

### OVF-0001: overflow

**Viewport:** Apple Watch 40mm  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Apple Watch 40mm? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0002: overflow

**Viewport:** Apple Watch 44mm  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Apple Watch 44mm? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0003: overflow

**Viewport:** Samsung Watch  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0004: overflow

**Viewport:** Huawei Watch GT  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Huawei Watch GT? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0005: overflow

**Viewport:** iPhone 5/5s/5c/SE (2016)  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on iPhone 5/5s/5c/SE (2016)? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0006: overflow

**Viewport:** Samsung Galaxy S6/S7  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Samsung Galaxy S6/S7? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0007: overflow

**Viewport:** Samsung Galaxy S8/S9  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0008: overflow

**Viewport:** Samsung Galaxy S10  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0009: overflow

**Viewport:** Samsung Galaxy S20  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0010: overflow

**Viewport:** Samsung Galaxy S23/S24  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Samsung Galaxy S23/S24? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0011: overflow

**Viewport:** iPhone 12/13 mini  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on iPhone 12/13 mini.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0012: overflow

**Viewport:** LG G4/G5/G6  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on LG G4/G5/G6? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0013: overflow

**Viewport:** Google Nexus 5  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Google Nexus 5.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0014: overflow

**Viewport:** iPhone 6/6s/7/8/SE 2020/SE 2022  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on iPhone 6/6s/7/8/SE 2020/SE 2022.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0015: overflow

**Viewport:** iPhone X/11 Pro  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on iPhone X/11 Pro? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0016: overflow

**Viewport:** iPhone 12/13/14/15 Pro  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0017: overflow

**Viewport:** iPhone 13/14/15/16  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on iPhone 13/14/15/16? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0018: overflow

**Viewport:** iPhone 16 Pro  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0019: overflow

**Viewport:** iPhone 8 Plus  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0020: overflow

**Viewport:** iPhone XR/11/11 Pro Max  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on iPhone XR/11/11 Pro Max.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0021: overflow

**Viewport:** Samsung Galaxy S10+  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0022: overflow

**Viewport:** Samsung Galaxy S20 FE/Ultra  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Samsung Galaxy S20 FE/Ultra.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0023: overflow

**Viewport:** Samsung Galaxy S21 Ultra  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Samsung Galaxy S21 Ultra? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0024: overflow

**Viewport:** Samsung Galaxy Note 20  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0025: overflow

**Viewport:** Samsung Galaxy A51/A71  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0026: overflow

**Viewport:** Google Pixel 2/3/4/5  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Google Pixel 2/3/4/5.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0027: overflow

**Viewport:** Google Pixel 4 XL  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Google Pixel 4 XL.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0028: overflow

**Viewport:** OnePlus 6/7/8/9/10  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on OnePlus 6/7/8/9/10.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0029: overflow

**Viewport:** Xiaomi Mi 9/10  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Xiaomi Mi 9/10? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0030: overflow

**Viewport:** Xiaomi Redmi Note 9  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Xiaomi Redmi Note 9.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0031: overflow

**Viewport:** Huawei P30/P40  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0032: overflow

**Viewport:** iPhone 12/13 Pro Max  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on iPhone 12/13 Pro Max.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0033: overflow

**Viewport:** iPhone 14 Plus  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on iPhone 14 Plus.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0034: overflow

**Viewport:** iPhone 14/15 Pro Max  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0035: overflow

**Viewport:** iPhone 15/16 Plus  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on iPhone 15/16 Plus? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0036: overflow

**Viewport:** iPhone 16 Pro Max  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on iPhone 16 Pro Max.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0037: overflow

**Viewport:** Samsung Galaxy Z Flip  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Samsung Galaxy Z Flip? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0038: overflow

**Viewport:** Samsung Galaxy Z Fold (unfolded)  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0039: overflow

**Viewport:** Samsung Galaxy Z Fold2 (unfolded)  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Samsung Galaxy Z Fold2 (unfolded).

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0040: overflow

**Viewport:** Small Android Tablet  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Small Android Tablet.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0041: overflow

**Viewport:** iPad Mini  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0042: overflow

**Viewport:** iPad 10.2"  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on iPad 10.2"? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0043: overflow

**Viewport:** iPad Air  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0044: overflow

**Viewport:** iPad Air (older)  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on iPad Air (older)? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0045: overflow

**Viewport:** iPad Pro 11"  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0046: overflow

**Viewport:** iPad Pro 12.9"  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on iPad Pro 12.9".

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0047: overflow

**Viewport:** Microsoft Surface 3  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Microsoft Surface 3? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0048: overflow

**Viewport:** Huawei MatePad Pro  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0049: overflow

**Viewport:** MacBook Air 13.3"  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0050: overflow

**Viewport:** MacBook Pro 13.3"  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on MacBook Pro 13.3"? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0051: overflow

**Viewport:** Microsoft Surface Pro  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Microsoft Surface Pro? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0052: overflow

**Viewport:** Microsoft Surface Laptop 13.5"  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0053: overflow

**Viewport:** MacBook Pro 16"  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on MacBook Pro 16".

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0054: overflow

**Viewport:** Microsoft Surface Book  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0055: overflow

**Viewport:** Microsoft Surface Laptop 15"  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0056: overflow

**Viewport:** Desktop HD  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0057: overflow

**Viewport:** Desktop HD+  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0058: overflow

**Viewport:** MacBook Pro 15"  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0059: overflow

**Viewport:** Desktop Full HD  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Desktop Full HD? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0060: overflow

**Viewport:** Desktop 2K/QHD  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Desktop 2K/QHD.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0061: overflow

**Viewport:** Desktop WQHD  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0062: overflow

**Viewport:** Desktop 4K UHD  
**Element:** `.font-sans.antialiased`

> Horizontal overflow on Desktop 4K UHD? Karen's not impressed with your CSS skills.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0063: overflow

**Viewport:** Desktop 4K DCI  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Desktop 4K DCI.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0064: overflow

**Viewport:** Ultrawide HD (21:9)  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Ultrawide HD (21:9).

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0065: overflow

**Viewport:** Ultrawide QHD (21:9)  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0066: overflow

**Viewport:** Ultrawide 5K2K (21:9)  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0067: overflow

**Viewport:** Super Ultrawide 32:9  
**Element:** `.font-sans.antialiased`

> Sweetie, your BODY is literally breaking its container on Super Ultrawide 32:9.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0068: overflow

**Viewport:** Dual UHD (32:9)  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0069: overflow

**Viewport:** iMac 5K Retina  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0070: overflow

**Viewport:** Apple Pro Display XDR  
**Element:** `.font-sans.antialiased`

> Your BODY thinks it's bigger than its container. Spoiler: it's not.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

### OVF-0071: overflow

**Viewport:** Desktop 8K UHD  
**Element:** `.font-sans.antialiased`

> Overflow issues? Really? Karen thought we left this in 2010.

**Fix:** Add max-width: 100% or use clamp() for responsive sizing

```css
/* Before */
.font-sans.antialiased {
  /* current styles */
}

/* After */
.font-sans.antialiased {
  max-width: 100%;
  overflow-x: auto;
}
```

---

## 📋 Medium Priority

### RWD-0072: design-system

**Viewport:** Apple Watch 40mm  
**Element:** `.font-sans.antialiased`

> Element barely fits on mobile but looks fine on desktop? Sounds like missing responsive styles.

**Fix:** Ensure proper responsive behavior with flexible layouts

```css
/* Before */
.font-sans.antialiased {
  /* May need responsive adjustments */
}

/* After */
.font-sans.antialiased {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .font-sans.antialiased {
    max-width: 800px;
  }
}
```

---


---

✨ This report was generated by Karen CLI
