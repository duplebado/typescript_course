import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware";

interface RequestWithBody extends Request {
    body: { [key: string]: string | undefined };
}

const router = Router();

router.get("/login", (req: Request, res: Response) => {
    res.send(`
        <form method="POST">
            <div>
                <label>Email</label>
                <input name="email" />
            </div>
            <div>
                <label>Password</label>
                <input name="password" type="password" />
            </div>
            <button>Submit</button>
        </form>
    `);
});

router.post("/login", (req: RequestWithBody, res: Response) => {
    const { email, password } = req.body;

    if (email && password && email === "test@ts.com" && password === "test") {
        req.session = { loggedIn: true };
        res.redirect("/");
    } else {
        res.send("Invalid email or password");
    }
});

router.get("/", (req: Request, res: Response) => {
    if (req.session && req.session.loggedIn) {
        res.send(`
            <div>
                <div>You're logged in</div>
                <a href="logout">Logout</a>
            </div>
        `);
    } else {
        res.send(`
            <div>
                <div>You're not logged in</div>
                <a href="login">Login</a>
            </div>
        `);
    }
});

router.get("/logout", (req: Request, res: Response) => {
    req.session = undefined;
    res.redirect("/");
});

router.get("/protected", requireAuth, (req: Request, res: Response) => {
    res.send("Welcome to protected route");
});

export { router };
