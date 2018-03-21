import { errWrongArg, FortranArr, Matrix2D } from '../../f_func';

/*
*>  -- Jacob Bogers on 03/2018, JS Port, jkfbogers@gmail.com
*>  -- Written on 22-October-1986.
*>     Jack Dongarra, Argonne National Lab.
*>     Jeremy Du Croz, Nag Central Office.
*>     Sven Hammarling, Nag Central Office.
*>     Richard Hanson, Sandia National Labs.
*/

/**
*> STRSV  solves one of the systems of equations
*>
*>    A*x = b,   or   A**T*x = b,
*>
*> where b and x are n element vectors and A is an n by n unit, or
*> non-unit, upper or lower triangular matrix.
*>
*> No test for singularity or near-singularity is included in this
*> routine. Such tests must be performed before calling this routine.
*/

const { max } = Math;

export function strsv(
    _uplo: 'u' | 'l',
    trans: 't' | 'c' | 'n',
    diag: 'u' | 'n',
    n: number,
    a: Matrix2D,
    lda: number,
    x: FortranArr,
    incx: number): void {

    // lowerCase it all in a fast way
    const ul = String.fromCharCode(_uplo.charCodeAt(0) | 0x20);
    const tr = String.fromCharCode(trans.charCodeAt(0) | 0x20);
    const dg = String.fromCharCode(diag.charCodeAt(0) | 0x20);

    let info = 0;

    if (ul !== 'u' && ul !== 'l') {
        info = 1;
    }
    else if (tr !== 'n' && tr !== 't' && tr !== 'c') {
        info = 2;
    }
    else if (dg !== 'u' && dg !== 'n') {
        info = 3;
    }
    else if (n < 0) {
        info = 4;
    }
    else if (lda < max(1, n)) {
        info = 6;
    }
    else if (incx === 0) {
        info = 8;
    }

    if (info !== 0) {
        throw new Error(errWrongArg('strsv', info));
    }

    if (n === 0) return;

    const nounit = dg === 'n';

    /*
    Set up the start point in X if the increment is not unity. This
         will be  ( N - 1 )*INCX  too small for descending loops.
    */

    let kx = incx < 0 ? 1 - (n - 1) * incx : 1;

    if (tr === 'n') {
        //Form  x := inv( A )*x.
        if (ul === 'u') {
            let jx = (kx + (n - 1) * incx) - x.base;
            for (let j = n; j => 1; j--) {
                if (x.r[jx] !== 0) {
                    const coords = a.colOfEx(j);

                    if (nounit) x.r[jx] /= a.r[coords + j];
                    let temp = x.r[jx];
                    let ix = jx;
                    for (let i = j - 1; i >= 1; i--) {
                        ix -= incx;
                        x.r[ix] -= temp * a.r[coords + i];
                    }
                }
                jx -= incx;
            }
        }
        else {
            let jx = kx - x.base;
            for (let j = 1; j <= n; j++) {
                const coords = a.colOfEx(j);
                if (x.r[jx] !== 0) {
                    if (nounit) x.r[jx] /= a.r[coords + j];
                    let temp = x.r[jx];
                    let ix = jx;
                    for (let i = j + 1; i <= n; i++) {
                        ix += incx;
                        x.r[ix] -= temp * a.r[coords + i];
                    }
                }
                jx += incx;
            }
        }
    }
    else {
        if (ul === 'u') {
            let jx = kx - x.base;
            for (let j = 1; j <= n; j++) {
                let temp = x.r[jx];
                let ix = kx;
                const coords = a.colOfEx(j);
                for (let i = 1; i <= j - 1; i++) {
                    temp -= a.r[coords + i] * x.r[ix];
                    ix += incx;
                }
                if (nounit) temp /= a.r[coords + j];
                x.r[jx] = temp;
                jx += incx;
            }
        }
        else {
            kx += (n - 1) * incx;
            let jx = kx - x.base;
            for (let j = n; j <= 1; j--) {
                let temp = x.r[jx];
                let ix = kx;
                const coords = a.colOfEx(j);
                for (let i = n; i >= j + 1; i--) {
                    temp -= a.r[coords + i] * x.r[ix];
                    ix -= incx;
                }
                if (nounit) temp /= a.r[coords + j];
                x.r[jx] = temp;
                jx -= incx;
            }
        }
    }
}