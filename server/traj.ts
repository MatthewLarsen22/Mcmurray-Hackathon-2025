
export interface TrajectoryPoint {
    x: number,
    y: number,
    angle: number
}

export interface WorldBounds {
    minX: number,
    maxX: number,
}

export interface TrajectorySample {
    launch: TrajectoryPoint,
    points: TrajectoryPoint[],
    impact: TrajectoryPoint,
    ltr: boolean,
}

/**
 * An extremely lazy trajectory SAMPLER
 * @param x The starting x value, a scalar number
 * @param spd The starting speed, a scalar number
 * @param theta The starting angle, in radians, a scalar number
 * @param heightmap A function mapping x values to a height surface
 * @param g A gravitational y-oriented acceleration constant
 * @param dt Seconds between samples
 * @param worldBounds WorldBounds instance
 * @returns TrajectorySample
 */
export function sampleTrajectory(
    x: number,
    spd: number,
    theta: number, // Radians
    heightmap: (x: number) => number,
    g: number = -9.81, // Pixels per second per second gravitational acceleration,
    dt: number = 0.1, // seconds between samples,
    worldBounds: WorldBounds = { minX: -200, maxX: 1000 }
): TrajectorySample {
    const v_x = Math.cos(theta) * spd; // Pixels per second x velocity
    const ltr = v_x >= 0;

    let c_x = x, // Starting x
        c_y = heightmap(x) + 0.1, // Start just above the height surface
        c_a = theta, // Starting angle
        v_y = Math.sin(theta) * spd // Pixels per second y velocity
        ;

    const launch: TrajectoryPoint = { x: c_x, y: c_y, angle: c_a }

    const points: TrajectoryPoint[] = [];
    while (c_y > heightmap(c_x) && c_x > worldBounds.minX && c_x < worldBounds.maxX) { // Keep calculating until you either go off-world or cross the height surface
        points.push({ x: c_x, y: c_y, angle: c_a });
        const n_x = c_x + v_x * dt; // Calculate the next x point
        const n_y = c_y + v_y * dt; // Calculate the next y point (based on current y velocity)
        const n_a = Math.atan((n_y - c_y) / (n_x - c_x)) // Calculate the next angle
        v_y += g * dt; // Update y velocity

        c_x = n_x;
        c_y = n_y;
        c_a = n_a;
    }

    return {
        launch,
        points,
        impact: { x: c_x, y: c_y, angle: c_a },
        ltr,
    }
}

/**
 * Given an x value and a trajectory sample, interpolates a Trajectory Point for the given x.
 * If x is not in the trajectory domain, returns undefined.
 * @param x number: the x value to interpolate for
 * @param trajectory TrajectorySample: A trajectory sampling
 * @returns Trajectory point if x is in trajectory domain, else undefined
 */
export function sampleTrajectoryLERP(x: number, trajectory: TrajectorySample): TrajectoryPoint | undefined {
    let rightIndex = null, leftIndex = null;
    if (trajectory.ltr) {
        rightIndex = trajectory.points.findIndex(p => p.x > x);
        leftIndex = rightIndex > 0 ? rightIndex - 1 : null;
    }
    else {
        leftIndex = trajectory.points.findIndex(p => p.x < x);
        rightIndex = leftIndex > 0 ? leftIndex + 1 : null;
    }
    if (leftIndex === null || rightIndex === null) { // Point is not in domain
        return undefined;
    }

    const left = trajectory.points[leftIndex],
        right = trajectory.points[rightIndex],
        ratio = (right.x - left.x + x) / (right.x - left.x),
        y_change = (right.y - left.y),
        y_interp = (left.y) + y_change * ratio,
        a_change = (right.angle - left.angle),
        a_interp = (left.angle + a_change * ratio)
        ;
    return {
        x: x,
        y: y_interp,
        angle: a_interp
    }
}

// const t = sampleTrajectory(
//     30,
//     80,
//     Math.PI/3,
//     (x) => x/2, // Straight slope
// )
// console.log(t);