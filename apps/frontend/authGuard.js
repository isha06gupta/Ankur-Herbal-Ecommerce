function checkAccess(allowedRole) {

    const user =
        JSON.parse(
            localStorage.getItem(
                "ayurLeafUser"
            )
        );

    const token =
        localStorage.getItem(
            "ayurLeafAuthToken"
        );

    // NOT LOGGED IN
    if (!user || !token) {

        window.location.href =
            "./index.html";

        return false;
    }

    // WRONG ROLE
    if (user.role !== allowedRole) {

        alert(
            "Access Denied"
        );

        window.location.href =
            "./index.html";

        return false;
    }

    return true;
}